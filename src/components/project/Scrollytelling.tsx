import React, { useEffect, useRef, useState } from 'react';

export interface ScrollySection {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconColorClass: string;
}

export default function Scrollytelling({ sections }: { sections: ScrollySection[] }) {
    const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');
    const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-40% 0px -40% 0px' }
        );

        observerRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const activeSection = sections.find(s => s.id === activeId) || sections[0];

    if (!activeSection) return null;

    return (
        <div className="flex flex-col md:flex-row gap-12 relative my-10 border-t border-amber-900/20 pt-10">
            {/* Left Column: Text blocks that scroll */}
            <div className="w-full md:w-1/2 space-y-[40vh] py-[20vh]">
                {sections.map((section, idx) => (
                    <div 
                        key={section.id} 
                        id={section.id}
                        ref={el => observerRefs.current[idx] = el}
                        className={`transition-all duration-700 ${activeId === section.id ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'}`}
                    >
                        <h3 className="text-2xl font-serif font-bold text-amber-50 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center text-sm font-mono">
                                {idx + 1}
                            </span>
                            {section.title}
                        </h3>
                        <p className="text-muted leading-relaxed font-serif text-lg">
                            {section.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Right Column: Sticky visual panel */}
            <div className="w-full md:w-1/2 hidden md:block">
                <div className="sticky top-1/4 h-[450px] bg-[#0f0e0d] border border-amber-900/30 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-700 shadow-[0_10px_40px_-15px_rgba(245,158,11,0.1)]">
                    <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                    
                    {/* The visual content changes when activeId changes */}
                    <div key={activeId} className="animate-fade-in flex flex-col items-center text-center p-8 relative z-10 w-full">
                        <div className={`w-40 h-40 rounded-full bg-black/40 border border-amber-900/50 flex items-center justify-center mb-8 shadow-inner ${activeSection.iconColorClass} transition-colors duration-1000`}>
                            <i className={`fa-solid ${activeSection.icon} text-6xl`}></i>
                        </div>
                        <h4 className="text-2xl font-serif text-white mb-4">{activeSection.title}</h4>
                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
