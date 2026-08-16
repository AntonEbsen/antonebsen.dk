import React, { useEffect, useRef, useState } from 'react';
import { unlockAchievement } from '@lib/gamification';
import * as duckdb from '@duckdb/duckdb-wasm';
import { checkReadOnly } from '../../lib/ai/sql-guard';
import { readEventStream } from '../../lib/ai/protocol';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import worker_url from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import worker_next_url from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

interface DataPlaygroundProps {
    /** Omitted when the project has no published replication CSV. */
    dataUrl?: string;
}

export default function DataPlayground({ dataUrl }: DataPlaygroundProps) {
    // Engine + connection are held in refs so they survive re-renders and can be
    // awaited directly (avoids stale-state races between init and the first query).
    const connRef = useRef<duckdb.AsyncDuckDBConnection | null>(null);
    const initPromiseRef = useRef<Promise<duckdb.AsyncDuckDBConnection> | null>(null);

    const [query, setQuery] = useState('SELECT * FROM main_data LIMIT 5');
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(false);
    const [ready, setReady] = useState(false);
    // null = not checked yet, false = the CSV isn't published.
    const [dataAvailable, setDataAvailable] = useState<boolean | null>(null);
    // Real column list, read from the loaded file rather than assumed. Kept in a ref
    // as well: generateSql needs it immediately after booting the engine, before a
    // state update would be visible in that closure.
    const schemaRef = useRef<string | null>(null);
    const setSchema = (s: string | null) => { schemaRef.current = s; };

    // Lazily boot DuckDB (~70MB WASM) only when the user actually runs a query,
    // instead of on mount — so visiting a project page doesn't download the engine.
    const initDB = async (): Promise<duckdb.AsyncDuckDBConnection> => {
        // selectBundle takes a DuckDBBundles object keyed by feature level, not an
        // array of them. Wrapped in an array, `bundles.mvp` was undefined, selectBundle
        // returned nothing, and the next line threw "Cannot read properties of
        // undefined (reading 'mainModule')" — so the engine never booted at all. The
        // wrong `DuckDBBundle[]` annotation is what made that typecheck.
        const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
            mvp: { mainModule: duckdb_wasm, mainWorker: worker_url },
            eh: { mainModule: duckdb_wasm_next, mainWorker: worker_next_url },
        };
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        const connection = await db.connect();

        // Load CSV
        await db.registerFileURL('main_data.csv', dataUrl, duckdb.DuckDBDataProtocol.HTTP, false);
        await connection.insertCSVFromPath('main_data.csv', {
            name: 'main_data',
            // `schema` here is the *database* schema to create the table in, not a
            // detection mode: passing 'auto' asked DuckDB for a schema named "auto"
            // and failed with "Schema with name auto does not exist!". Omitting it
            // uses the default. Column type detection is `detect` below.
            header: true,
            detect: true,
        });

        // Ask DuckDB what it actually loaded, so the AI helper describes this file
        // rather than the VIX columns that used to be hardcoded here.
        try {
            const described = await connection.query('DESCRIBE main_data');
            const cols = described.toArray()
                .map((r: any) => r.toJSON())
                .map((r: any) => `${r.column_name} (${r.column_type})`);
            setSchema(`Table: main_data. Columns: ${cols.join(', ')}`);
        } catch {
            setSchema('Table: main_data.');
        }

        connRef.current = connection;
        setReady(true);
        return connection;
    };

    const ensureDb = (): Promise<duckdb.AsyncDuckDBConnection> => {
        if (connRef.current) return Promise.resolve(connRef.current);
        if (!initPromiseRef.current) {
            setInitializing(true);
            initPromiseRef.current = initDB().finally(() => setInitializing(false));
        }
        return initPromiseRef.current;
    };

    useEffect(() => {
        // Reset the (lazy) engine if the data source changes.
        connRef.current = null;
        initPromiseRef.current = null;
        setReady(false);
        setSchema(null);
        setDataAvailable(null);

        // Check the file exists before offering a query box. Several projects link
        // to replication data that hasn't been published yet; without this the user
        // downloads a 70MB engine only to get a raw SQL error.
        let cancelled = false;

        if (!dataUrl) {
            // No URL means no dataset, and probing for it is worse than useless:
            // the caller used to pass '', and fetch('') resolves against the
            // *current page* with a 200 — so the check passed on every project
            // and the query box appeared even where there was nothing to query.
            // Every query then ran against HTML and failed.
            setDataAvailable(false);
        } else {
            fetch(dataUrl, { method: 'HEAD' })
                .then(res => { if (!cancelled) setDataAvailable(res.ok); })
                .catch(() => { if (!cancelled) setDataAvailable(false); });
        }

        // Allow the Project Bot to push generated SQL into the editor.
        const handleBotSQL = (e: CustomEvent) => setQuery(e.detail);
        window.addEventListener('project-bot-sql', handleBotSQL as EventListener);

        return () => {
            cancelled = true;
            window.removeEventListener('project-bot-sql', handleBotSQL as EventListener);
        };
    }, [dataUrl]);

    const runQuery = async () => {
        try {
            setError(null);
            const conn = await ensureDb();
            const result = await conn.query(query);
            setResults(result.toArray().map((row: any) => row.toJSON()));
            // Only a query that actually returned counts.
            unlockAchievement('reckoning');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const [nlQuery, setNlQuery] = useState('');
    const [generating, setGenerating] = useState(false);
    const [answer, setAnswer] = useState<string | null>(null);

    /**
     * Ask a question of the data and get an answer, not just a query.
     *
     * This used to stop after writing SQL into the editor and leave the visitor to
     * press Run and read the table themselves — the model never saw its own results.
     * Now the three steps run together: translate, execute locally in DuckDB, then
     * hand the rows back for the model to interpret.
     *
     * The data never leaves the browser except as the handful of rows that go into
     * the explanation prompt, and the SQL is checked before it reaches the engine.
     */
    const askData = async () => {
        if (!nlQuery.trim() || generating) return;
        setGenerating(true);
        setError(null);
        setAnswer(null);

        try {
            const conn = await ensureDb();

            // 1. Translate. The schema comes from DuckDB itself, so the model is told
            //    the real columns rather than guessing at them.
            const res = await fetch('/api/text-to-sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: nlQuery,
                    schema: schemaRef.current ?? 'Table: main_data.',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `Server error (${res.status})`);

            // 2. Check before executing. The endpoint already rejects anything that is
            //    not read-only; this is the same check at the point of execution, where
            //    the consequences would actually land.
            const check = checkReadOnly(data.sql);
            if (!check.ok) throw new Error(check.reason);

            setQuery(check.sql!);

            // 3. Execute locally.
            const result = await conn.query(check.sql!);
            const rows = result.toArray().map((row: any) => row.toJSON());
            setResults(rows);
            unlockAchievement('reckoning');

            // 4. Interpret. Only a sample goes to the model — enough to characterise
            //    the answer, not the whole dataset.
            //
            //    DuckDB returns BIGINT columns as JS BigInt, which JSON.stringify
            //    throws on ("Do not know how to serialize a BigInt"). Years and counts
            //    are BIGINT here, so that is most result sets.
            const sample = JSON.stringify(
                rows.slice(0, 20),
                (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
                1,
            ).slice(0, 4000);
            const explainRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: document.documentElement.lang || 'en',
                    message: [
                        `A visitor asked this about a dataset on Anton's site: "${nlQuery}"`,
                        '',
                        'This query ran against it:',
                        check.sql,
                        '',
                        `It returned ${rows.length} row(s). Up to the first 20:`,
                        sample,
                        '',
                        'Answer their question from these results in two or three sentences.',
                        'Give the actual numbers. If the results do not answer it, say so plainly.',
                    ].join('\n'),
                }),
            });

            if (explainRes.ok) {
                let prose = '';
                await readEventStream(explainRes, (event) => {
                    if (event.type === 'text') {
                        prose += event.text;
                        setAnswer(prose);
                    } else if (event.type === 'error') {
                        setAnswer(null);
                    }
                });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="rounded-xl border border-rule bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-card border-b border-rule px-4 py-2 flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-muted flex items-center gap-2">
                    <i className="fa-solid fa-database text-blue-500"></i>
                    Data Playground (DuckDB)
                </span>
                <span className="text-[10px] text-muted">
                    {dataAvailable === false
                        ? 'Dataset not published yet'
                        : initializing ? 'Starting engine…' : ready ? 'Ready' : 'Idle — run a query to start'}
                </span>
            </div>

            {dataAvailable === false && (
                <div className="p-6 text-center">
                    <i className="fa-solid fa-database text-dim text-2xl mb-3"></i>
                    <p className="text-sm font-bold text-muted mb-1">The replication data isn't published yet</p>
                    <p className="text-xs text-muted max-w-md mx-auto">
                        This playground runs SQL against the project's own dataset in your browser.
                        It will light up as soon as <code className="font-mono text-muted">{dataUrl.split('/').pop()}</code> is available.
                    </p>
                </div>
            )}

            {/* AI Natural Language Input */}
            <div className="p-4 bg-bg border-b border-rule-strong" hidden={dataAvailable === false}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="✨ Ask the data in plain English…"
                        className="flex-1 bg-card border border-rule-strong rounded-lg px-3 py-1.5 text-xs text-text placeholder-muted focus:outline-none focus:border-blue-500 transition-colors"
                        value={nlQuery}
                        onChange={(e) => setNlQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && askData()}
                    />
                    <button
                        onClick={askData}
                        disabled={generating}
                        aria-label="Ask the data this question"
                        className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                    >
                        {generating
                            ? <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
                            : <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>}
                    </button>
                </div>
            </div>

            <div className="p-0" hidden={dataAvailable === false}>
                <textarea
                    className="w-full h-24 p-4 font-mono text-sm bg-sunken text-green-400 focus:outline-none resize-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    spellCheck={false}
                    aria-label="SQL query"
                />
            </div>

            <div className="px-4 py-2 bg-card border-t border-rule flex justify-end" hidden={dataAvailable === false}>
                <button
                    onClick={runQuery}
                    disabled={initializing}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    {initializing
                        ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Starting engine…</>
                        : <><i className="fa-solid fa-play"></i> Run SQL</>}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-mono border-t border-red-100">
                    {error}
                </div>
            )}

            {answer && (
                <div className="p-4 bg-blue-50 border-t border-blue-100" aria-live="polite">
                    <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">
                        <i className="fa-solid fa-wand-magic-sparkles mr-1" aria-hidden="true"></i>
                        Answer
                    </p>
                    {/* Plain text: the interpretation is prose, and rendering it as
                        markup would put model output into the DOM as HTML. */}
                    <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{answer}</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="overflow-x-auto max-h-60 border-t border-rule">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-card text-muted font-bold sticky top-0">
                            <tr>
                                {Object.keys(results[0]).map(key => (
                                    <th key={key} className="px-4 py-2 border-b border-rule whitespace-nowrap">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-text">
                            {results.map((row, i) => (
                                <tr key={i} className="hover:bg-card">
                                    {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="px-4 py-2 whitespace-nowrap font-mono text-muted">{String(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
