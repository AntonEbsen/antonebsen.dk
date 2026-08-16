import React, { useEffect, useRef, useState, type FormEvent } from 'react';
// mermaid is imported dynamically where it is used. As a top-level import it
// pulled cytoscape and every diagram renderer — about 1.4 MB — into the eager
// payload of every project page, for a widget most visitors never open.
import { escapeHtml } from '../../lib/ai/safe-html';
import { readEventStream } from '../../lib/ai/protocol';
import { MODEL_LABEL } from '../../lib/ai/model';

interface ProjectBotProps {
    projectTitle: string;
    codeSnippet?: { lang: string; code: string; title: string };
}

interface Turn {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

/**
 * Renders assistant prose. Escape first, then add the small set of markup this
 * widget supports — so nothing the model writes can become a tag it did not intend.
 * Mermaid is unaffected by escaping: it reads textContent, which the browser
 * entity-decodes back to the original source.
 */
function renderReply(text: string): string {
    return escapeHtml(text)
        .replace(/```mermaid\n([\s\S]*?)\n```/g, '<div class="mermaid">$1</div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-xs font-mono">$1</code>')
        .replace(/\n/g, '<br/>');
}

export default function ProjectBot({ projectTitle, codeSnippet }: ProjectBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [simpleMode, setSimpleMode] = useState(false);
    const [critiqueMode, setCritiqueMode] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Turn[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [isOpen]);

    /**
     * This widget used to be built on the AI SDK's `useChat`, destructuring
     * `input` / `handleInputChange` / `handleSubmit` / `isLoading` behind an `as any`.
     * Those belong to `useCompletion`, not `useChat`, so every one of them was
     * undefined: the submit guard was always falsy and the chips threw. It talks to
     * the chat endpoint's NDJSON stream directly now.
     */
    async function send(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;

        const userTurn: Turn = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
        const replyId = `a-${Date.now()}`;
        const history = [...messages, userTurn];

        setMessages([...history, { id: replyId, role: 'assistant', text: '' }]);
        setInput('');
        setIsStreaming(true);

        const appendToReply = (chunk: string) =>
            setMessages((prev) =>
                prev.map((m) => (m.id === replyId ? { ...m, text: m.text + chunk } : m)),
            );

        let reply = '';

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.map(({ role, text: content }) => ({ role, content })),
                    lang: document.documentElement.lang || 'en',
                    context: {
                        type: 'project',
                        data: { title: projectTitle, simple: simpleMode, critique: critiqueMode, codeSnippet },
                    },
                }),
            });

            if (!res.ok) {
                const detail = await res.json().catch(() => null);
                throw new Error(detail?.message || `Server error (${res.status})`);
            }

            await readEventStream(res, (event) => {
                if (event.type === 'text') {
                    reply += event.text;
                    appendToReply(event.text);
                } else if (event.type === 'error') {
                    reply += event.message;
                    appendToReply(`⚠️ ${event.message}`);
                }
            });

            if (!reply.trim()) {
                appendToReply('⚠️ The reviewer is unavailable right now.');
                return;
            }

            // The project page listens for these: a SQL block runs in the DuckDB
            // playground, a [Node: id] highlights that node in the graph.
            const sqlMatch = reply.match(/```sql\n([\s\S]*?)\n```/);
            if (sqlMatch) {
                window.dispatchEvent(new CustomEvent('project-bot-sql', { detail: sqlMatch[1].trim() }));
            }
            const nodeMatch = reply.match(/\[Node: (.*?)\]/);
            if (nodeMatch) {
                window.dispatchEvent(new CustomEvent('project-bot-graph', { detail: nodeMatch[1].trim() }));
            }
        } catch (err: any) {
            console.error('ProjectBot:', err);
            appendToReply(`⚠️ ${err?.message || 'Connection failed.'}`);
        } finally {
            setIsStreaming(false);
        }
    }

    // Run mermaid on new messages. The engine is fetched on first use only —
    // most conversations never contain a diagram, and it is ~1.4 MB.
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            if (document.querySelector('.mermaid')) {
                try {
                    const { default: mermaid } = await import('mermaid');
                    if (cancelled) return;
                    await mermaid.run({ querySelector: '.mermaid' });
                } catch {
                    // A diagram that fails to render must not take the chat down.
                }
            }
            if (!cancelled) scrollToBottom();
        }, 100);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [messages, isOpen]);

    // These are economics papers and models, not shipped software — the previous chips
    // asked about "architecture", "code quality" and "how can I scale this?", which are
    // the wrong questions for a seminar paper on globalisation and the welfare state.
    // Project pages get their entry points here rather than the general context buttons
    // used on blog posts: The Reviewer already owns this surface, and two assistants on
    // one page is worse than one that asks the right things.
    const chips = [
        'What problem does this solve?',
        'What are its limitations?',
        'Critique the method',
        'Show me a graph of this',
    ];

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        void send(input);
    };

    return (
        <>
            {/* Toggle Button - Now at Footer Level for visibility */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[2147483647] w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group border-2 border-transparent hover:border-black/10"
                style={{ boxShadow: '0 0 30px rgba(255,255,255,0.3)' }}
                title="AI Project Reviewer"
            >
                {isOpen ? <i className="fa-solid fa-xmark text-xl"></i> : <i className="fa-solid fa-glasses text-xl group-hover:rotate-12 transition-transform"></i>}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 w-[90vw] md:w-[450px] h-[600px] max-h-[70vh] bg-[#1E2122] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[2147483647] overflow-hidden backdrop-blur-xl"
                    style={{ boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
                >
                    {/* Header */}
                    <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                                <i className="fa-solid fa-user-secret text-xl"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-text text-sm">The Reviewer</h3>
                                <p className="text-[10px] text-muted uppercase tracking-widest">Constructive Critic</p>
                            </div>
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setSimpleMode(!simpleMode)}
                                className={`px-2 py-1 text-[10px] rounded border ${simpleMode ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/20 text-muted hover:text-white'}`}
                                title="Simple Mode"
                            >
                                ELI5
                            </button>
                            <button
                                onClick={() => setCritiqueMode(!critiqueMode)}
                                className={`px-2 py-1 text-[10px] rounded border ${critiqueMode ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/20 text-muted hover:text-white'}`}
                                title="Critique Mode"
                            >
                                Roast
                            </button>
                            <a href="/ai-reviewer" className="text-muted hover:text-white transition-colors" title="Help">
                                <i className="fa-solid fa-circle-question"></i>
                            </a>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gradient-to-b from-black/50 to-transparent">
                        {/* Initial Greeting */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                                <i className="fa-solid fa-robot text-xs text-white"></i>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm text-gray-300 shadow-lg">
                                <p>Reviewing <strong>{projectTitle}</strong>... I'm ready to audit the architecture, code, and impact. Be warned, I don't sugarcoat.</p>
                            </div>
                        </div>

                        {messages.map((m) => (
                            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${m.role === 'user' ? 'bg-blue-600/20 text-blue-500' : 'bg-white/10 text-white'}`}>
                                    <i className={`fa-solid ${m.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
                                </div>
                                <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-lg backdrop-blur-sm ${m.role === 'user'
                                    ? 'bg-blue-600/10 border border-blue-500/30 text-blue-100 rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none markdown-body'
                                    }`}>
                                    {m.role === 'assistant'
                                        ? <div dangerouslySetInnerHTML={{ __html: renderReply(m.text) }} />
                                        : m.text}
                                </div>
                            </div>
                        ))}
                        {isStreaming && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1 animate-pulse">
                                    <i className="fa-solid fa-microchip text-xs text-white"></i>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-xs text-gray-500 italic">
                                    Analyzing logic gates...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chips - Context Aware */}
                    {!isStreaming && messages.length < 3 && (
                        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                            {chips.map(chip => (
                                <button
                                    key={chip}
                                    onClick={() => void send(chip)}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 bg-black/80 border-t border-white/10 backdrop-blur-md">
                        <form onSubmit={onSubmit} className="relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about the stack, scalability, or code..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors placeholder:text-muted"
                            />
                            <button
                                type="submit"
                                disabled={isStreaming || !input.trim()}
                                className="absolute right-2 top-1.5 w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer z-[100]"
                            >
                                <i className="fa-solid fa-arrow-up text-sm"></i>
                            </button>
                        </form>
                        <div className="mt-2 flex justify-between items-center px-1">
                            <span className="text-[10px] text-muted">Powered by {MODEL_LABEL}</span>
                            <div className="flex gap-2">
                                <button className="text-muted hover:text-white transition-colors" title="Attach Code/File (Coming Soon)">
                                    <i className="fa-solid fa-paperclip text-xs"></i>
                                </button>
                                <button className="text-muted hover:text-white transition-colors" title="Voice Input (Coming Soon)">
                                    <i className="fa-solid fa-microphone text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
