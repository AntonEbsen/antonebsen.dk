import React, { useEffect, useState } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import worker_url from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import worker_next_url from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

interface DataPlaygroundProps {
    dataUrl: string;
}

export default function DataPlayground({ dataUrl }: DataPlaygroundProps) {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
    const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
    const [query, setQuery] = useState('SELECT * FROM main_data LIMIT 5');
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initDB = async () => {
            try {
                const MANUAL_BUNDLES: duckdb.DuckDBBundle[] = [
                    {
                        mvp: {
                            mainModule: duckdb_wasm,
                            mainWorker: worker_url,
                        },
                        eh: {
                            mainModule: duckdb_wasm_next,
                            mainWorker: worker_next_url,
                        },
                    },
                ];
                // Select bundle based on browser support
                const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
                const worker = new Worker(bundle.mainWorker!);
                const logger = new duckdb.ConsoleLogger();
                const db = new duckdb.AsyncDuckDB(logger, worker);
                await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
                setDb(db);

                const connection = await db.connect();
                setConn(connection);

                // Load CSV
                await db.registerFileURL('main_data.csv', dataUrl, duckdb.DuckDBDataProtocol.HTTP, false);
                await connection.insertCSVFromPath('main_data.csv', {
                    name: 'main_data',
                    schema: 'auto',
                    header: true,
                    detect: true
                });

                setLoading(false);
            } catch (err: any) {
                console.error("DuckDB Init Error", err);
                setError(err.message);
                setLoading(false);
            }
        };

        initDB();

        // Listen for SQL events from the Bot
        const handleBotSQL = (e: CustomEvent) => {
            console.log("Playground received SQL:", e.detail);
            setQuery(e.detail);
            // Optionally auto-run, but safer to let user click run (or we can trigger it)
            // Let's trigger it for the magic effect
            // But we can't call runQuery easily from here without moving it or using a ref
            // So we'll just set it for now and maybe add a toast "SQL generated!"
        };

        window.addEventListener('project-bot-sql', handleBotSQL as EventListener);

        return () => {
            window.removeEventListener('project-bot-sql', handleBotSQL as EventListener);
            // connection?.close(); 
        }
    }, [dataUrl]);

    const runQuery = async () => {
        if (!conn) return;
        try {
            setError(null);
            const result = await conn.query(query);
            setResults(result.toArray().map((row: any) => row.toJSON()));
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-slate-600 flex items-center gap-2">
                    <i className="fa-solid fa-database text-blue-500"></i>
                    Data Playground (DuckDB)
                </span>
                <span className="text-[10px] text-slate-400">{loading ? 'Loading Engine...' : 'Ready'}</span>
            </div>

            <div className="p-0">
                <textarea
                    className="w-full h-32 p-4 font-mono text-sm bg-slate-900 text-green-400 focus:outline-none resize-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    spellCheck={false}
                />
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                    onClick={runQuery}
                    disabled={loading}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-play"></i> Run Query
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
                        <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
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
