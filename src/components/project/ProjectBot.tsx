import React, { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';

interface ProjectBotProps {
    projectTitle: string;
}

export default function ProjectBot({ projectTitle }: ProjectBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: {
            context: { title: projectTitle }
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
        <div className="fixed bottom-8 right-8 z-50">
            {/* Chat Window */}
            <div
                className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 transition-all duration-300 origin-bottom-right overflow-hidden flex flex-col ${isOpen ? 'opacity-100 scale-100 h-[500px]' : 'opacity-0 scale-90 h-0 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="font-bold text-sm">The Reviewer (AI)</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="text-center text-xs text-slate-400 mt-10">
                            <p>Ask me about methodology, findings, or code structure.</p>
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask a question..."
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-primary text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </form>
            </div>

            {/* Float Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`absolute bottom-0 right-0 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-500 rotate-90 opacity-0 pointer-events-none' : 'bg-slate-900 rotate-0'}`}
            >
                <i className="fa-solid fa-robot text-xl"></i>
            </button>
        </div>
    );
}
