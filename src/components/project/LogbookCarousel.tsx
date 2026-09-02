import React from 'react';

export interface LogbookEntry {
    id: string;
    date: string;
    title: string;
    description: string;
    duration: string;
    type: 'audio' | 'video';
}

export default function LogbookCarousel({ entries }: { entries: LogbookEntry[] }) {
    return (
        <div className="w-full overflow-hidden my-10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-amber-500/90 flex items-center gap-3">
                    <i className="fa-solid fa-compact-disc animate-spin-slow"></i> Forskningens Logbog
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-muted font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">{entries.length} Indlæg</span>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {entries.map((entry) => (
                    <div key={entry.id} className="snap-center md:snap-start shrink-0 w-72 bg-black/40 border border-amber-900/30 rounded-xl overflow-hidden hover:border-amber-500/50 transition-colors group cursor-pointer relative shadow-lg">
                        {/* Thumbnail area */}
                        <div className="h-36 bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden border-b border-amber-900/30">
                            <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-30 mix-blend-overlay"></div>
                            
                            {/* Abstract visualizer bars */}
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end justify-center gap-1 px-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="w-full bg-amber-500" style={{ height: `${Math.random() * 100}%` }}></div>
                                ))}
                            </div>
                            
                            <i className={`fa-solid ${entry.type === 'video' ? 'fa-video' : 'fa-podcast'} text-4xl text-amber-500/30 group-hover:text-amber-500/50 transition-colors group-hover:scale-110 duration-500 z-10`}></i>
                            <div className="absolute bottom-3 right-3 bg-black/80 text-amber-500 text-[10px] font-mono px-2 py-1 rounded backdrop-blur-sm border border-amber-500/30 z-10">
                                {entry.duration}
                            </div>
                            
                            {/* Play overlay */}
                            <div className="absolute inset-0 bg-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                                <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <i className="fa-solid fa-play ml-1"></i>
                                </div>
                            </div>
                        </div>
                        
                        {/* Content area */}
                        <div className="p-5">
                            <time className="text-[10px] text-amber-500/60 font-mono uppercase tracking-wider mb-2 block">{entry.date}</time>
                            <h4 className="text-white font-serif text-lg mb-2 line-clamp-1 group-hover:text-amber-400 transition-colors">{entry.title}</h4>
                            <p className="text-dim text-sm font-serif line-clamp-2 leading-relaxed">{entry.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
