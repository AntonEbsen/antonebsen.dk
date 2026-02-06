import React, { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';

interface ProjectBotProps {
    projectTitle: string;
    codeSnippet?: { lang: string; code: string; title: string };
}

export default function ProjectBot({ projectTitle, codeSnippet }: ProjectBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [simpleMode, setSimpleMode] = useState(false);

    // Chips for quick start
    const chips = ["Methodology check", "Key findings summary", "Explain like I'm 5"];

    const handleChipClick = (chip: string) => {
        if (!isOpen) setIsOpen(true);
        // We can't easily programmatically submit with useChat, so we'll just set input
        // Or better, we define a better way. Vercel AI SDK 'append' is useful here but 'useChat' returns append.
        // Let's grab append from useChat
    };

    // We need append from useChat to support chips properly
    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: '/api/chat',
        body: {
            context: { title: projectTitle, simple: simpleMode, codeSnippet }
        },
        onFinish: (message) => {
            // Detect SQL block: ```sql ... ```
            const sqlMatch = message.content.match(/```sql\n([\s\S]*?)\n```/);
            if (sqlMatch) {
                const query = sqlMatch[1].trim();
                console.log("Found SQL:", query);
                // Dispatch event for DataPlayground
                window.dispatchEvent(new CustomEvent('project-bot-sql', { detail: query }));
            }
        }
    });

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
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <div>
                            <span className="font-bold text-sm block leading-none">The Reviewer</span>
                            <span className="text-[10px] text-slate-400 font-mono">ALL SYSTEMS ONLINE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Simplify Toggle */}
                        <button
                            onClick={() => setSimpleMode(!simpleMode)}
                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${simpleMode ? 'bg-green-500 text-white border-green-400' : 'bg-transparent text-slate-400 border-slate-600 hover:text-white'}`}
                            title="Explain like I'm 5"
                        >
                            ELI5 {simpleMode ? 'ON' : 'OFF'}
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
                                        onClick={() => append({ role: 'user', content: chip })}
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
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-slate-900 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                }`}>
                                {/* Render simple markdown (bold/code) */}
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                                    __html: m.content
                                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                                        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
                                        .replace(/\[Source: (.*?)\]/g, '<span class="text-[10px] text-slate-400 block mt-1 border-t border-slate-100 pt-1">📚 Source: $1</span>')
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
