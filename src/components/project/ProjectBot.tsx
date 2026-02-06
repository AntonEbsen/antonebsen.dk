import React, { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import mermaid from 'mermaid';

interface ProjectBotProps {
    projectTitle: string;
    codeSnippet?: { lang: string; code: string; title: string };
}

export default function ProjectBot({ projectTitle, codeSnippet }: ProjectBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [simpleMode, setSimpleMode] = useState(false);
    const [critiqueMode, setCritiqueMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial message
    const initialMessage = {
        id: 'init',
        role: 'system',
        content: `Analyzing ${projectTitle}... Ready for review.`
    };

    // Initialize Mermaid - Lazy load to prevent hydration crash
    useEffect(() => {
        // mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [isOpen]);

    // We need append from useChat to support chips properly
    // @ts-ignore - Types mismatch with installed version but runtime is valid
    const { messages, input, handleInputChange, handleSubmit, isLoading, append, setInput } = useChat({
        api: '/api/chat',
        body: {
            context: { title: projectTitle, simple: simpleMode, critique: critiqueMode, codeSnippet }
        },
        onError: (error: any) => {
            console.error("Chat Error:", error);
            alert("Connection to The Reviewer failed. Please try again. Code: " + error.message);
        },
        onFinish: (message: any) => {
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
    }) as any;

    // Run Mermaid on new messages
    useEffect(() => {
        if (!isOpen) return;
        setTimeout(() => {
            mermaid.run({
                querySelector: '.mermaid'
            });
            scrollToBottom();
        }, 100);
    }, [messages, isOpen]);


    const handleFileAttach = (e: ChangeEvent<HTMLInputElement>) => {
        // Placeholder for v4
    };

    const chips = [
        "Explain this architecture",
        "Critique the code quality",
        "How can I scale this?",
        "Show me a graph of this"
    ];

    const handleChipClick = (chip: string) => {
        append({ role: 'user', content: chip });
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
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-black"></span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 w-[90vw] md:w-[450px] h-[600px] max-h-[70vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[2147483647] overflow-hidden backdrop-blur-xl"
                    style={{ boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
                >
                    {/* Header */}
                    <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                                <i className="fa-solid fa-user-secret text-xl"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">The Reviewer</h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest">Constructive Critic</p>
                            </div>
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setSimpleMode(!simpleMode)}
                                className={`px-2 py-1 text-[10px] rounded border ${simpleMode ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/20 text-white/50 hover:text-white'}`}
                                title="Simple Mode"
                            >
                                ELI5
                            </button>
                            <button
                                onClick={() => setCritiqueMode(!critiqueMode)}
                                className={`px-2 py-1 text-[10px] rounded border ${critiqueMode ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/20 text-white/50 hover:text-white'}`}
                                title="Critique Mode"
                            >
                                Roast
                            </button>
                            <a href="/ai-reviewer" className="text-white/30 hover:text-white transition-colors" title="Help">
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

                        {messages.map(m => (
                            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${m.role === 'user' ? 'bg-blue-600/20 text-blue-500' : 'bg-white/10 text-white'}`}>
                                    <i className={`fa-solid ${m.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
                                </div>
                                <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-lg backdrop-blur-sm ${m.role === 'user'
                                    ? 'bg-blue-600/10 border border-blue-500/30 text-blue-100 rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none markdown-body'
                                    }`}>
                                    {
                                        m.role === 'ai'
                                            ? <div dangerouslySetInnerHTML={{
                                                __html:
                                                    // Basic markdown parser for bold/code + mermaid
                                                    m.content
                                                        .replace(/```mermaid\n([\s\S]*?)\n```/g, '<div class="mermaid">$1</div>')
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                        .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-xs font-mono">$1</code>')
                                                        .replace(/\n/g, '<br/>')
                                            }} />
                                            : m.content
                                    }
                                </div>
                            </div>
                        ))}
                        {isLoading && (
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
                    {!isLoading && messages.length < 3 && (
                        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                            {chips.map(chip => (
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
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                // Manually trigger handleSubmit from SDK if available, or just append user message
                                if (input?.trim()) {
                                    handleSubmit(e);
                                }
                            }}
                            className="relative"
                        >
                            <input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Ask about the stack, scalability, or code..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors placeholder:text-white/20"
                            />
                            <button
                                type="submit"
                                // disabled={!input?.trim()} - Always enabled to prevent freezing
                                className="absolute right-2 top-1.5 w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <i className="fa-solid fa-arrow-up text-sm"></i>
                            </button>
                        </form>
                        <div className="mt-2 flex justify-between items-center px-1">
                            <span className="text-[10px] text-white/20">Powered by Gemini 2.0 Flash</span>
                            <div className="flex gap-2">
                                <button className="text-white/20 hover:text-white transition-colors" title="Attach Code/File (Coming Soon)">
                                    <i className="fa-solid fa-paperclip text-xs"></i>
                                </button>
                                <button className="text-white/20 hover:text-white transition-colors" title="Voice Input (Coming Soon)">
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
