import React, { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';

interface ProjectBotProps {
    projectTitle: string;
    codeSnippet?: { lang: string; code: string; title: string };
}

export default function ProjectBot({ projectTitle, codeSnippet }: ProjectBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [simpleMode, setSimpleMode] = useState(false);
    const [critiqueMode, setCritiqueMode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Chips for quick start
    const chips = ["Methodology check", "Key findings summary", "Explain like I'm 5"];

    const handleChipClick = (msg: string) => {
        if (!isOpen) setIsOpen(true);
        append({ role: 'user', content: msg });
    };

    const handleExplainCode = (e: CustomEvent) => {
        if (!isOpen) setIsOpen(true);
        append({ role: 'user', content: `Explain this code logic: "${e.detail}"` });
    };

    useEffect(() => {
        window.addEventListener('project-bot-explain-code', handleExplainCode as EventListener);
        return () => window.removeEventListener('project-bot-explain-code', handleExplainCode as EventListener);
    }, [isOpen]);

    // We need append from useChat to support chips properly
    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: '/api/chat',
        body: {
            context: { title: projectTitle, simple: simpleMode, critique: critiqueMode, codeSnippet }
        },
        onFinish: (message) => {
            // Detect SQL block
            const sqlMatch = message.content.match(/```sql\n([\s\S]*?)\n```/);
            if (sqlMatch) {
                const query = sqlMatch[1].trim();
                window.dispatchEvent(new CustomEvent('project-bot-sql', { detail: query }));
            }

            // Detect Graph Node: [Node: id]
            const nodeMatch = message.content.match(/\[Node: (.*?)\]/);
            if (nodeMatch) {
                const nodeId = nodeMatch[1].trim();
                window.dispatchEvent(new CustomEvent('project-bot-graph', { detail: nodeId }));
            }
        }
    });

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any current speech
            window.speechSynthesis.cancel();

            if (isSpeaking) {
                setIsSpeaking(false);
                return;
            }

            // Strip markdown chars for cleaner speech
            const cleanText = text.replace(/[*#`_\[\]]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.1;
            utterance.pitch = 1;

            utterance.onend = () => setIsSpeaking(false);

            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-8 right-8 z-50 font-sans">
            {/* Chat Window */}
            <div
                className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 transition-all duration-300 origin-bottom-right overflow-hidden flex flex-col ${isOpen ? 'opacity-100 scale-100 h-[600px]' : 'opacity-0 scale-90 h-0 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white select-none">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${critiqueMode ? 'bg-red-500' : 'bg-green-400'}`}></div>
                        <div>
                            <span className="font-bold text-sm block leading-none">The Reviewer</span>
                            <span className="text-[10px] text-slate-400 font-mono">{critiqueMode ? 'CRITIQUE PROTOCOL' : 'STANDARD PROTOCOL'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Critique Toggle */}
                        <button
                            onClick={() => setCritiqueMode(!critiqueMode)}
                            className={`text-[10px] w-6 h-6 rounded flex items-center justify-center transition-colors ${critiqueMode ? 'bg-red-500/20 text-red-400 border border-red-500' : 'hover:bg-white/10 text-slate-400'}`}
                            title="Critique Mode"
                        >
                            <i className="fa-solid fa-gavel"></i>
                        </button>

                        {/* Simplify Toggle */}
                        <button
                            onClick={() => setSimpleMode(!simpleMode)}
                            className={`text-[10px] w-6 h-6 rounded flex items-center justify-center transition-colors ${simpleMode ? 'bg-green-500/20 text-green-400 border border-green-500' : 'hover:bg-white/10 text-slate-400'}`}
                            title="ELI5 Mode"
                        >
                            <i className="fa-solid fa-child-reaching"></i>
                        </button>

                        {/* Quiz Mode */}
                        <button
                            onClick={() => {
                                if (!isOpen) setIsOpen(true);
                                append({ role: 'user', content: "Quiz me on this project. Ask a hard question." });
                            }}
                            className={`text-[10px] w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10 text-slate-400`}
                            title="Take a Quiz"
                        >
                            <i className="fa-solid fa-graduation-cap"></i>
                        </button>

                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white ml-2">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="text-center mt-8 space-y-4">
                            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto flex items-center justify-center text-3xl">
                                🤖
                            </div>
                            <p className="text-sm text-slate-500 px-6">
                                I have read the full paper and code. How can I assist your review?
                            </p>

                            {/* Chips */}
                            <div className="flex flex-wrap justify-center gap-2 px-4">
                                {chips.map(chip => (
                                    <button
                                        key={chip}
                                        onClick={() => handleChipClick(chip)}
                                        className="text-xs bg-white border border-slate-200 hover:border-accent hover:text-accent px-3 py-1.5 rounded-full transition-colors shadow-sm"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed group relative ${m.role === 'user'
                                    ? 'bg-slate-900 text-white rounded-br-none'
                                    : `text-slate-700 rounded-bl-none shadow-sm ${critiqueMode && m.role !== 'user' ? 'bg-red-50 border border-red-100' : 'bg-white border border-slate-200'}`
                                }`}>
                                {/* Audio Button (Only for AI) */}
                                {m.role !== 'user' && (
                                    <button
                                        onClick={() => speak(m.content)}
                                        className="absolute -top-3 -right-2 w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-[10px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Listen"
                                    >
                                        <i className={`fa-solid ${isSpeaking ? 'fa-stop' : 'fa-volume-high'}`}></i>
                                    </button>
                                )}

                                {/* Render simple markdown (bold/code) */}
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                                    __html: m.content
                                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                                        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
                                        .replace(/\[Source: (.*?)\]/g, '<span class="text-[10px] text-slate-400 block mt-1 border-t border-slate-100 pt-1">📚 Source: $1</span>')
                                        .replace(/\[Node: (.*?)\]/g, '<span class="text-[10px] text-blue-500 font-bold ml-1 cursor-help" title="Graph Node">#$1</span>')
                                        .replace(/\n/g, '<br/>')
                                }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1 items-center">
                                <span className="text-xs text-slate-400 mr-2">Thinking</span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={simpleMode ? "Explain simple terms..." : "Ask technical questions..."}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </form>
            </div>

            {/* Float Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="absolute bottom-0 right-0 w-14 h-14 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group"
                >
                    <i className="fa-solid fa-robot text-xl group-hover:rotate-12 transition-transform"></i>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>
            )}
        </div>
    );
}
