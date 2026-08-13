import React, { useEffect, useRef, useState } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import worker_url from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import worker_next_url from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

interface DataPlaygroundProps {
    dataUrl: string;
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
        const MANUAL_BUNDLES: duckdb.DuckDBBundle[] = [
            {
                mvp: { mainModule: duckdb_wasm, mainWorker: worker_url },
                eh: { mainModule: duckdb_wasm_next, mainWorker: worker_next_url },
            },
        ];
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
            schema: 'auto',
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
        fetch(dataUrl, { method: 'HEAD' })
            .then(res => { if (!cancelled) setDataAvailable(res.ok); })
            .catch(() => { if (!cancelled) setDataAvailable(false); });

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
        } catch (err: any) {
            setError(err.message);
        }
    };

    const [nlQuery, setNlQuery] = useState('');
    const [generating, setGenerating] = useState(false);

    const generateSql = async () => {
        if (!nlQuery.trim()) return;
        setGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/text-to-sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: nlQuery,
                    // Boot the engine first if needed, so the model is told the real columns.
                    schema: schemaRef.current ?? (await ensureDb(), schemaRef.current) ?? 'Table: main_data.'
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setQuery(data.sql);
            setGenerating(false);
        } catch (err: any) {
            setError("AI Error: " + err.message);
            setGenerating(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-slate-600 flex items-center gap-2">
                    <i className="fa-solid fa-database text-blue-500"></i>
                    Data Playground (DuckDB)
                </span>
                <span className="text-[10px] text-slate-600">
                    {dataAvailable === false
                        ? 'Dataset not published yet'
                        : initializing ? 'Starting engine…' : ready ? 'Ready' : 'Idle — run a query to start'}
                </span>
            </div>

            {dataAvailable === false && (
                <div className="p-6 text-center">
                    <i className="fa-solid fa-database text-slate-300 text-2xl mb-3"></i>
                    <p className="text-sm font-bold text-slate-600 mb-1">The replication data isn't published yet</p>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                        This playground runs SQL against the project's own dataset in your browser.
                        It will light up as soon as <code className="font-mono text-slate-600">{dataUrl.split('/').pop()}</code> is available.
                    </p>
                </div>
            )}

            {/* AI Natural Language Input */}
            <div className="p-4 bg-slate-900 border-b border-slate-700" hidden={dataAvailable === false}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="✨ Ask the data in plain English…"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        value={nlQuery}
                        onChange={(e) => setNlQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && generateSql()}
                    />
                    <button
                        onClick={generateSql}
                        disabled={generating}
                        aria-label="Generate SQL from the question above"
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
                    className="w-full h-24 p-4 font-mono text-sm bg-slate-950 text-green-400 focus:outline-none resize-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    spellCheck={false}
                    aria-label="SQL query"
                />
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-end" hidden={dataAvailable === false}>
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

            {results.length > 0 && (
                <div className="overflow-x-auto max-h-60 border-t border-slate-100">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
                            <tr>
                                {Object.keys(results[0]).map(key => (
                                    <th key={key} className="px-4 py-2 border-b border-slate-200 whitespace-nowrap">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {results.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="px-4 py-2 whitespace-nowrap font-mono text-slate-600">{String(val)}</td>
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
