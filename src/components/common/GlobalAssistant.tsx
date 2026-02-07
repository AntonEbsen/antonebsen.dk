import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import mermaid from 'mermaid';

// --- Types ---
interface GlobalAssistantProps {
    initialContext?: {
        type: 'project' | 'general' | 'blog' | 'cv';
        data?: any;
    };
    defaultPersona?: string;
}

export default function GlobalAssistant({ initialContext, defaultPersona = 'default' }: GlobalAssistantProps) {
    // --- State ---
    const [isOpen, setIsOpen] = useState(false);
    const [persona, setPersona] = useState(defaultPersona);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- AI SDK ---
    const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append } = useChat({
        api: '/api/chat',
        body: {
            context: initialContext,
            persona: persona,
            lang: 'en' // TODO: Detect language from URL or Prop
        },
        onError: (error: any) => {
            console.error("AI Error:", error);
            // In a real app, show a toast or UI error
        },
        onFinish: (message: any) => {
            // Check for special tags (Graph, SQL) if needed
        }
    } as any) as any;

    // --- Effects ---
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Initialize Mermaid
    useEffect(() => {
        // mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    }, []);

    // --- Helpers ---
    const handleChipClick = (text: string) => {
        append({ role: 'user', content: text });
    };

    const getPersonaTitle = () => {
        switch (persona) {
            case 'recruiter': return 'Recruiter Agent';
            case 'tech': return 'Tech Lead Agent';
            case 'eli5': return 'ELI5 Agent';
            default: return "Anton's Assistant";
        }
    };

    // --- Render ---
    return (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end pointer-events-none">

            {/* Window */}
            <div
                className={`
                    pointer-events-auto 
                    w-[calc(100vw-2rem)] md:w-[380px] h-[550px] max-h-[75vh] 
                    mb-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl 
                    flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 origin-bottom-right
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'}
                `}
                style={{ boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
            >
                {/* Header */}
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center cursor-move">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center">
                            <i className={`fa-solid ${initialContext?.type === 'project' ? 'fa-user-secret' : 'fa-robot'}`}></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{initialContext?.type === 'project' ? 'The Reviewer' : getPersonaTitle()}</h3>
                            <p className="text-[10px] text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 items-center">
                        {initialContext?.type !== 'project' && (
                            <select
                                value={persona}
                                onChange={(e) => setPersona(e.target.value)}
                                className="bg-black/50 border border-white/10 text-white text-[10px] rounded px-2 py-1 outline-none hover:border-white/30 transition-colors cursor-pointer"
                            >
                                <option value="default">Default</option>
                                <option value="recruiter">Recruiter</option>
                                <option value="tech">Tech Lead</option>
                                <option value="eli5">ELI5</option>
                            </select>
                        )}
                        <button onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gradient-to-b from-black/50 to-transparent">
                    {/* Intro */}
                    {messages.length === 0 && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                                <i className="fa-solid fa-robot text-xs text-white"></i>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm text-gray-300 shadow-lg">
                                <p>
                                    {initialContext?.type === 'project'
                                        ? `Reviewing **${initialContext.data?.title}**... I'm ready to audit the code and architecture.`
                                        : "Hi! I'm Anton's AI. Ask me about his experience, projects, or skills!"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Chat List */}
                    {messages.map((m: any) => (
                        <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${m.role === 'user' ? 'bg-blue-600/20 text-blue-500' : 'bg-white/10 text-white'}`}>
                                <i className={`fa-solid ${m.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
                            </div>
                            <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-lg backdrop-blur-sm ${m.role === 'user'
                                ? 'bg-blue-600/10 border border-blue-500/30 text-blue-100 rounded-tr-none'
                                : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none markdown-body'
                                }`}>
                                <div dangerouslySetInnerHTML={{
                                    __html: m.content
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-xs font-mono">$1</code>')
                                        .replace(/\n/g, '<br/>')
                                }} />
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1 animate-pulse">
                                <i className="fa-solid fa-microchip text-xs text-white"></i>
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-xs text-gray-500 italic">
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chips */}
                {messages.length === 0 && !isLoading && (
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                        {(initialContext?.type === 'project'
                            ? ["Critique this", "Explain architecture", "Scale this"]
                            : ["Summarize his CV", "Why hire Anton?", "Show skills graph"]
                        ).map(chip => (
                            <button
                                key={chip}
                                onClick={() => handleChipClick(chip)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-3 bg-black/80 border-t border-white/10 backdrop-blur-md">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder={initialContext?.type === 'project' ? "Audit this project..." : "Ask anything..."}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors placeholder:text-white/20"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="absolute right-2 top-1.5 w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer z-50"
                        >
                            <i className="fa-solid fa-arrow-up text-sm"></i>
                        </button>
                    </form>
                    <div className="mt-2 flex justify-between items-center px-1">
                        <span className="text-[10px] text-white/20">Powered by Gemini 2.0 Flash</span>
                        {/* Future: Voice/File Buttons */}
                        <div className="flex gap-2">
                            <button className="text-white/20 hover:text-white transition-colors" title="Voice (Coming Soon)"><i className="fa-solid fa-microphone text-xs"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto
                    w-14 h-14 bg-white text-black rounded-full shadow-2xl 
                    flex items-center justify-center hover:scale-110 transition-all group border-2 border-transparent hover:border-black/10
                    ${isOpen ? 'rotate-90 bg-gray-200' : ''}
                `}
                style={{ boxShadow: '0 0 30px rgba(255,255,255,0.3)' }}
                title="AI Assistant"
            >
                {isOpen ? <i className="fa-solid fa-xmark text-xl"></i> : <i className="fa-solid fa-message text-xl group-hover:scale-110 transition-transform"></i>}
            </button>
        </div>
    );
}
