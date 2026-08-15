import React, { useState } from 'react';

interface CodeVaultProps {
    title: string;
    lang: string;
    code: string;
}

export default function CodeVault({ title, lang, code }: CodeVaultProps) {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            // Calculate absolute position relative to document to handle scrolling
            // Use wrapper relative position
            const wrapperRect = document.getElementById('code-vault-wrapper')?.getBoundingClientRect();

            if (wrapperRect) {
                setTooltip({
                    x: rect.left - wrapperRect.left + (rect.width / 2),
                    y: rect.top - wrapperRect.top,
                    text: selection.toString()
                });
            }
        } else {
            setTooltip(null);
        }
    };

    const handleExplain = () => {
        if (tooltip) {
            window.dispatchEvent(new CustomEvent('project-bot-explain-code', { detail: tooltip.text }));
            setTooltip(null);
            // Deselect
            window.getSelection()?.removeAllRanges();
        }
    };

    return (
        <div id="code-vault-wrapper" className="bg-bg rounded-[32px] overflow-hidden shadow-2xl text-white relative group" onMouseUp={handleMouseUp}>
            {/* Header */}
            <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/10 select-none">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs font-mono text-muted ml-2">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-muted italic hidden group-hover:block transition-all animate-pulse">
                        Select text to explain
                    </span>
                    {/* Accent-on-accent/20 measured 3.75:1 — below AA for 10px text.
                        A neutral panel behind the same accent text clears it. */}
                    <span className="text-[10px] bg-sunken text-accent px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-accent/30">{lang}</span>
                </div>
            </div>

            {/* Code */}
            {/* Long lines scroll sideways on a phone. Without tabindex a keyboard user
                cannot reach the overflow at all — nothing inside is focusable. */}
            <div
                className="p-6 md:p-8 overflow-x-auto bg-[#0d1117] relative min-h-[200px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                tabIndex={0}
                role="region"
                aria-label={`${lang} source`}
            >
                <pre className="font-mono text-sm leading-relaxed text-dim"><code>{code}</code></pre>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute z-10 -translate-x-1/2 -translate-y-full pb-2"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <button
                        onClick={handleExplain}
                        className="bg-card text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl hover:bg-black transition-all flex items-center gap-2 border border-rule-strong whitespace-nowrap"
                    >
                        <i className="fa-solid fa-robot text-accent"></i> Explain selection
                    </button>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-card mx-auto"></div>
                </div>
            )}
        </div>
    );
}
