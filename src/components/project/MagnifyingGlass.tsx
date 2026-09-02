import React, { useState, useRef } from 'react';

export default function MagnifyingGlass({ 
    cursiveText, 
    cleanText 
}: { 
    cursiveText: string, 
    cleanText: string 
}) {
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full rounded-2xl overflow-hidden cursor-crosshair border border-amber-900/40 shadow-2xl my-10"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* The base layer: Old, illegible archival document */}
            <div className="bg-[#e8d5b5] p-10 md:p-16 w-full h-full text-[#3e2723] font-serif" style={{ backgroundImage: "url('/assets/images/noise.png')", backgroundBlendMode: "multiply" }}>
                <p 
                    className="text-3xl md:text-5xl leading-relaxed opacity-60 blur-[1px] transform -rotate-1 skew-x-2" 
                    style={{ fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive", textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}
                >
                    {cursiveText}
                </p>
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/20 to-transparent pointer-events-none mix-blend-multiply"></div>
            </div>

            {/* The reveal layer: Clean transcription inside a clip-path */}
            <div 
                className="absolute inset-0 bg-[#121110] p-10 md:p-16 text-amber-50 font-sans pointer-events-none"
                style={{
                    clipPath: isHovered ? `circle(120px at ${mousePos.x}px ${mousePos.y}px)` : 'circle(0px at 0px 0px)',
                    transition: 'clip-path 0.05s linear' // Faster transition for smoother tracking
                }}
            >
                <p className="text-xl md:text-2xl leading-loose font-mono text-amber-500/90 bg-[#121110]">
                    {cleanText}
                </p>
                
                {/* The "glass" rim */}
                <div 
                    className="absolute border-2 border-amber-500/40 rounded-full pointer-events-none shadow-[inset_0_0_30px_rgba(245,158,11,0.2)] bg-amber-500/5 backdrop-contrast-125"
                    style={{
                        left: mousePos.x - 120,
                        top: mousePos.y - 120,
                        width: 240,
                        height: 240,
                    }}
                >
                    {/* Crosshair inside magnifying glass */}
                    <div className="absolute top-1/2 left-1/2 w-4 h-px bg-amber-500/50 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 h-4 w-px bg-amber-500/50 -translate-x-1/2 -translate-y-1/2"></div>
                </div>
            </div>
            
            {/* Instruction tooltip */}
            <div className={`absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-amber-500/80 text-xs font-mono px-4 py-2 rounded-full border border-amber-500/30 transition-opacity duration-500 flex items-center gap-2 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                <i className="fa-solid fa-magnifying-glass animate-pulse"></i> 
                <span>Før musen over for at transskribere</span>
            </div>
        </div>
    );
}
