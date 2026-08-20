import React, { useEffect, useRef, useState, type FormEvent } from 'react';
// mermaid is imported dynamically where it is used. As a top-level import it
// pulled cytoscape and every diagram renderer — about 1.4 MB — into the eager
// payload of every project page, for a widget most visitors never open.
import { renderModelText } from '../../lib/ai/safe-html';
import { readEventStream } from '../../lib/ai/protocol';
import { MODEL_LABEL } from '../../lib/ai/model';
import { createChatRenderers } from '../../lib/ai/chat-ui';
import { createMessageActions } from '../../lib/ai/message-actions';
import { CHAT_THEME, CHAT_ACTION_THEME } from '../../lib/ai/chat-theme';

interface ProjectBotProps {
    projectTitle: string;
    codeSnippet?: { lang: string; code: string; title: string };
}

interface Turn {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

/*
 * This file used to carry its own `renderReply` — a fourth escape-then-regex renderer
 * alongside the three the other clients shared. Two implementations of the same
 * security-critical transform is how the original XSS survived as long as it did, so
 * this one now calls renderModelText like everything else. Its mermaid fence keeps
 * working because that renderer learned fenced blocks first, deliberately.
 */

export default function ProjectBot({ projectTitle, codeSnippet }: ProjectBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [simpleMode, setSimpleMode] = useState(false);
    const [critiqueMode, setCritiqueMode] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Turn[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingId, setStreamingId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    /*
     * The bridge between React and the shared renderers.
     *
     * chat-ui.ts builds DOM imperatively — that is deliberate, because returning markup
     * to be re-parsed is exactly how the original XSS happened. But React owns the
     * bubble it would append into and will reconcile away anything it did not render.
     *
     * So each assistant turn carries one element React renders empty and never gives
     * children to. React does not diff children it never created, so imperative nodes
     * survive re-renders there. It is also why the container passed below is the extras
     * element rather than the bubble: chat-ui's bubbleOf() falls through to the
     * container itself when it finds no .message-bubble inside.
     */
    const extrasRefs = useRef(new Map<string, HTMLDivElement>());
    const queued = useRef<Array<{ id: string; run: (el: Element) => void }>>([]);
    const activeRequest = useRef<AbortController | null>(null);

    const renderers = useRef<ReturnType<typeof createChatRenderers> | null>(null);
    if (!renderers.current && typeof document !== 'undefined') {
        renderers.current = createChatRenderers({
            inputId: 'projectbot-input',
            formId: 'projectbot-form',
            messagesId: 'projectbot-messages',
            lang: document.documentElement.lang || 'en',
            classes: CHAT_THEME,
        });
    }

    /** Render now if the element exists, otherwise once React has put it there. */
    const intoExtras = (id: string, run: (el: Element) => void) => {
        const el = extrasRefs.current.get(id);
        if (el) run(el);
        else queued.current.push({ id, run });
    };

    useEffect(() => {
        if (!queued.current.length) return;
        queued.current = queued.current.filter(({ id, run }) => {
            const el = extrasRefs.current.get(id);
            if (!el) return true;
            run(el);
            return false;
        });
    });

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
        setStreamingId(replyId);

        const appendToReply = (chunk: string) =>
            setMessages((prev) =>
                prev.map((m) => (m.id === replyId ? { ...m, text: m.text + chunk } : m)),
            );

        let reply = '';

        try {
            activeRequest.current = new AbortController();
            const res = await fetch('/api/chat', {
                method: 'POST',
                signal: activeRequest.current.signal,
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
                } else if (event.type === 'tool') {
                    // Previously ignored. The server answers the model with "Shown to
                    // the visitor." either way, so a chart it asked for was reported as
                    // displayed while nothing had been drawn.
                    intoExtras(replyId, (el) =>
                        renderers.current?.handleToolEvent(event.name, event.input, el));
                } else if (event.type === 'citations') {
                    intoExtras(replyId, (el) =>
                        renderers.current?.renderCitations(event.sources, el));
                } else if (event.type === 'error') {
                    reply += event.message;
                    appendToReply(`⚠️ ${event.message}`);
                }
            }, activeRequest.current?.signal);

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
            // Pressing stop is a choice, not a failure: the partial review stays on
            // screen and nothing is appended to it.
            if (err?.name !== 'AbortError') {
                console.error('ProjectBot:', err);
                appendToReply(`⚠️ ${err?.message || 'Connection failed.'}`);
            }
        } finally {
            activeRequest.current = null;
            setStreamingId(null);
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
                className="fixed bottom-6 right-6 z-[2147483647] w-14 h-14 bg-accent text-bg rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group border-2 border-transparent hover:border-black/10"
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
                            <div className="w-10 h-10 rounded-full bg-accent text-bg flex items-center justify-center">
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
                                className={`px-2 py-1 text-[10px] rounded border ${simpleMode ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/20 text-muted hover:text-text'}`}
                                title="Simple Mode"
                            >
                                ELI5
                            </button>
                            <button
                                onClick={() => setCritiqueMode(!critiqueMode)}
                                className={`px-2 py-1 text-[10px] rounded border ${critiqueMode ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/20 text-muted hover:text-text'}`}
                                title="Critique Mode"
                            >
                                Roast
                            </button>
                            <a href="/ai-reviewer" className="text-muted hover:text-text transition-colors" title="Help">
                                <i className="fa-solid fa-circle-question"></i>
                            </a>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        id="projectbot-messages"
                        tabIndex={0}
                        aria-label="Review conversation"
                        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                    >
                        {/* Initial Greeting */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                                <i className="fa-solid fa-robot text-xs text-text"></i>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm text-dim shadow-lg">
                                <p>Reviewing <strong>{projectTitle}</strong>... I'm ready to audit the architecture, code, and impact. Be warned, I don't sugarcoat.</p>
                            </div>
                        </div>

                        {messages.map((m) => (
                            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${m.role === 'user' ? 'bg-accent/20 text-accent' : 'bg-rule text-dim'}`}>
                                    <i className={`fa-solid ${m.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
                                </div>
                                {m.role === 'assistant' ? (
                                    <div className="flex flex-col max-w-[85%] ai-content-wrapper">
                                        <div className="message-bubble">
                                            <div
                                                className={`chat-prose chat-prose--compact${m.id === streamingId ? ' chat-prose--streaming' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: renderModelText(m.text) }}
                                            />
                                            {/* Rendered empty and never given children by React — see the
                                                bridge note above. Charts and citations land here. */}
                                            <div
                                                ref={(el) => {
                                                    if (el) extrasRefs.current.set(m.id, el);
                                                    else extrasRefs.current.delete(m.id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-[85%] p-3 rounded-control text-sm bg-accent/10 border border-accent/30 text-dim">
                                        {m.text}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isStreaming && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1 animate-pulse">
                                    <i className="fa-solid fa-microchip text-xs text-text"></i>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-xs text-muted italic">
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
                                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted hover:bg-accent hover:text-bg hover:border-accent transition-all"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 bg-black/80 border-t border-white/10 backdrop-blur-md">
                        <form id="projectbot-form" onSubmit={onSubmit} className="relative">
                            <input
                                id="projectbot-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about the stack, scalability, or code..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-text focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors placeholder:text-muted"
                            />
                            <button
                                type={isStreaming ? 'button' : 'submit'}
                                onClick={isStreaming ? () => activeRequest.current?.abort() : undefined}
                                disabled={!isStreaming && !input.trim()}
                                aria-label={isStreaming ? 'Stop generating' : 'Send message'}
                                title={isStreaming ? 'Stop generating' : 'Send message'}
                                className="absolute right-2 top-1.5 w-9 h-9 bg-accent text-bg rounded-lg flex items-center justify-center hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer z-[100]"
                            >
                                <i className={`fa-solid ${isStreaming ? 'fa-stop' : 'fa-arrow-up'} text-sm`}></i>
                            </button>
                        </form>
                        <div className="mt-2 flex justify-between items-center px-1">
                            <span className="text-[10px] text-muted">Powered by {MODEL_LABEL}</span>
                            <div className="flex gap-2">
                                <button className="text-muted hover:text-text transition-colors" title="Attach Code/File (Coming Soon)">
                                    <i className="fa-solid fa-paperclip text-xs"></i>
                                </button>
                                <button className="text-muted hover:text-text transition-colors" title="Voice Input (Coming Soon)">
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
