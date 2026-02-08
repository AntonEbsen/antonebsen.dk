import React, { useState, useEffect, useRef } from 'react';

declare global {
    interface Window {
        loadPyodide: any;
    }
}

interface Props {
    initialCode?: string;
}

export default function PyodideSandbox({ initialCode = "print('Hello from Quantum Certs!')" }: Props) {
    const [output, setOutput] = useState<string>("");
    const [isRunning, setIsRunning] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [code, setCode] = useState(initialCode);
    const pyodideRef = useRef<any>(null);

    async function loadPyodide() {
        if (pyodideRef.current) return;

        setIsRunning(true);
        setOutput("Initializing Python Environment (Pyodide)...");

        try {
            // Load script dynamically if not present
            if (!window.loadPyodide) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            pyodideRef.current = await window.loadPyodide();
            setIsLoaded(true);
            setOutput("Ready. Click Run to execute.");
        } catch (err: any) {
            setOutput(`Error loading Python: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    }

    async function runCode() {
        if (!pyodideRef.current) {
            await loadPyodide(); // Auto-load on first run
        }

        if (!pyodideRef.current) return;

        setIsRunning(true);
        setOutput("Running...");

        try {
            // Redirect stdout
            pyodideRef.current.setStdout({ batched: (msg: string) => setOutput(prev => prev + (prev ? '\n' : '') + msg) });

            // Run
            await pyodideRef.current.runPythonAsync(code);

        } catch (err: any) {
            setOutput(prev => prev + '\nTraceback:\n' + err.message);
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-black/80 rounded border border-white/10 overflow-hidden font-mono text-[10px]">
            {/* Toolbar */}
            <div className="flex justify-between items-center px-2 py-1 bg-white/5 border-b border-white/10">
                <span className="text-yellow-500 font-bold">main.py</span>
                <button
                    onClick={runCode}
                    disabled={isRunning}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded ${isRunning ? 'bg-gray-700 text-gray-400' : 'bg-green-600 hover:bg-green-500 text-white'} transition-colors`}
                >
                    <i className={`fa-solid ${isRunning ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
                    {isRunning ? 'Running...' : 'Run'}
                </button>
            </div>

            {/* Editor */}
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-transparent text-gray-300 p-2 resize-none focus:outline-none"
                spellCheck={false}
            />

            {/* Output Console */}
            <div className="h-24 bg-black border-t border-white/10 p-2 overflow-y-auto">
                <pre className="text-green-400 whitespace-pre-wrap font-mono">{output}</pre>
            </div>
        </div>
    );
}
