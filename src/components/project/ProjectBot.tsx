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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    // Recruiter Mode State
    const [jobMode, setJobMode] = useState(false);
    const [jobDescription, setJobDescription] = useState("");

    // Chips for quick start
    const chips = ["Methodology check", "Key findings summary", "Explain like I'm 5"];
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Mermaid
    useEffect(() => {
        mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    }, []);

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
    const { messages, input, handleInputChange, handleSubmit, isLoading, append, setInput } = useChat({
        api: '/api/chat',
        body: {
            context: { title: projectTitle, simple: simpleMode, critique: critiqueMode, codeSnippet }
        },
        onError: (error) => {
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
    });

    // Run Mermaid on new messages
    useEffect(() => {
        if (messages.length > 0) {
            // Tiny timeout to let DOM render
            setTimeout(() => {
                mermaid.run({
                    nodes: document.querySelectorAll('.mermaid-code')
                });
            }, 100);
        }
    }, [messages]);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (isSpeaking) {
                setIsSpeaking(false);
                return;
            }
            const cleanText = text.replace(/[*#`_\[\]]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.1;
            utterance.onend = () => setIsSpeaking(false);
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    const startListening = () => {
        // @ts-ignore
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            // @ts-ignore
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
            };

            recognition.start();
        } else {
            alert("Voice input not supported in this browser.");
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        alert("Vision module initialization... (Requires backend update to handle multipart/form-data)");
    }

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-8 right-8 z-[9999] font-sans">
            {/* Chat Window */}
            <div
                className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 transition-all duration-300 origin-bottom-right overflow-hidden flex flex-col ${isOpen ? 'opacity-100 scale-100 h-[600px]' : 'opacity-0 scale-90 h-0 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white select-none relative">
                    <div className="flex items-center gap-2">
                        {/* Status Dot */}
                        <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${critiqueMode ? 'bg-red-500' : jobMode ? 'bg-purple-400' : 'bg-green-400'}`}></div>
                        <div>
                            <span className="font-bold text-sm block leading-none">The Reviewer</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                                {critiqueMode ? 'CRITIQUE PROTOCOL' : jobMode ? 'RECRUITER MODE' : 'STANDARD PROTOCOL'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Job Mode Toggle */}
                        <button onClick={() => setJobMode(!jobMode)} className={`text-[10px] w-6 h-6 rounded flex items-center justify-center transition-colors ${jobMode ? 'bg-purple-500/20 text-purple-400 border border-purple-500' : 'hover:bg-white/10 text-slate-400'}`} title="Recruiter Mode"><i className="fa-solid fa-briefcase"></i></button>

                        <button onClick={() => setCritiqueMode(!critiqueMode)} className={`text-[10px] w-6 h-6 rounded flex items-center justify-center transition-colors ${critiqueMode ? 'bg-red-500/20 text-red-400 border border-red-500' : 'hover:bg-white/10 text-slate-400'}`} title="Critique Mode"><i className="fa-solid fa-gavel"></i></button>
                        <button onClick={() => setSimpleMode(!simpleMode)} className={`text-[10px] w-6 h-6 rounded flex items-center justify-center transition-colors ${simpleMode ? 'bg-green-500/20 text-green-400 border border-green-500' : 'hover:bg-white/10 text-slate-400'}`} title="ELI5 Mode"><i className="fa-solid fa-child-reaching"></i></button>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white ml-2"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <a href="/ai-reviewer" target="_blank" className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-1 opacity-50 hover:opacity-100"><i className="fa-regular fa-circle-question"></i><span>Docs</span></a>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
                    {/* Job Mode Overlay */}
                    {jobMode && messages.length === 0 && (
                        <div className="absolute inset-0 bg-slate-50 z-10 p-6 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                <i className="fa-solid fa-briefcase text-2xl text-purple-500"></i>
                            </div>
                            <h3 className="font-bold text-slate-700">Recruiter Mode</h3>
                            <p className="text-sm text-slate-500">Paste the Job Description below. I will analyze the specific fit between this portfolio and the role.</p>
                            <textarea
                                className="w-full h-32 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none font-sans"
                                placeholder="Paste Job Description here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            ></textarea>
                            <button
                                onClick={() => {
                                    append({ role: 'user', content: `Analyze the fit for this Job Description:\n\n${jobDescription}` });
                                    setJobMode(false); // Switch back to chat view
                                }}
                                disabled={!jobDescription.trim()}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50"
                            >
                                Analyze Candidate Fit
                            </button>
                        </div>
                    )}

                    {messages.length === 0 && !jobMode && (
                        <div className="text-center mt-8 space-y-4">
                            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto flex items-center justify-center text-3xl">🤖</div>
                            <p className="text-sm text-slate-500 px-6">I have read the full paper and code. How can I assist your review?</p>
                            <div className="flex flex-wrap justify-center gap-2 px-4">
                                {chips.map(chip => (
                                    <button key={chip} onClick={() => handleChipClick(chip)} className="text-xs bg-white border border-slate-200 hover:border-accent hover:text-accent px-3 py-1.5 rounded-full transition-colors shadow-sm">{chip}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.id} className={`flex gap-3 mb-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs border ${m.role === 'user' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-purple-600'}`}>
                                <i className={`fa-solid ${m.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed relative ${m.role === 'user'
                                ? 'bg-slate-900 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                                }`}>
                                {m.role !== 'user' && (
                                    <button onClick={() => speak(m.content)} className="absolute -top-5 left-0 text-slate-400 hover:text-purple-600 transition-colors text-xs" title="Listen">
                                        <i className={`fa-solid ${isSpeaking ? 'fa-stop' : 'fa-volume-high'}`}></i>
                                    </button>
                                )}
                                <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{
                                    __html: m.content
                                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                                        .replace(/`([^`]+)`/g, '<code class="bg-black/10 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
                                        .replace(/```mermaid\n([\s\S]*?)```/g, '<div class="mermaid-code bg-white p-2 rounded border border-slate-100 my-2 overflow-x-auto">$1</div>')
                                        .replace(/\[Source: (.*?)\]/g, '<span class="text-[10px] opacity-70 block mt-2 pt-2 border-t border-white/20">📚 $1</span>')
                                        .replace(/\[Node: (.*?)\]/g, '<span class="text-[10px] text-blue-400 font-bold ml-1">#$1</span>')
                                        .replace(/\n/g, '<br/>')
                                }} />

                                {m.role !== 'user' && (m.content.toLowerCase().includes('hire') || m.content.toLowerCase().includes('interview')) && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <a href={`mailto:anton@antonebsen.dk?subject=Interview: ${projectTitle}`} className="block w-full text-center bg-purple-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm">
                                            Book Interview
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs text-purple-600"><i className="fa-solid fa-robot"></i></div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 items-center">
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
                    {/* Vision Upload */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-slate-600 transition-colors px-2">
                        <i className="fa-solid fa-paperclip"></i>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                    <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400" value={input} onChange={handleInputChange} placeholder={isListening ? "Listening..." : "Ask..."} />

                    {/* Voice Input */}
                    <button type="button" onClick={startListening} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-600'}`}>
                        <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                    </button>

                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </form>
            </div>

            {/* Float Button */}
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="absolute bottom-0 right-0 w-14 h-14 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group">
                    <i className="fa-solid fa-robot text-xl group-hover:rotate-12 transition-transform"></i>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>
            )}
        </div>
    );
}
