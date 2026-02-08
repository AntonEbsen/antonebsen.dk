import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Collaborator {
    name: string;
    role?: string;
    description?: string;
    image?: string;
    links?: {
        linkedin?: string;
        github?: string;
        website?: string;
    };
    status?: {
        text: string;
        color: "green" | "red" | "blue" | "yellow";
    };
}

interface Props {
    collaborators: Collaborator[];
    label?: string;
}

export default function CollaboratorSpotlight({ collaborators, label = "Collaborators" }: Props) {
    const [selected, setSelected] = useState<Collaborator | null>(null);

    return (
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 relative z-20">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{label}</span>

            <div className="flex flex-wrap justify-center gap-3">
                {collaborators.map((collab) => (
                    <button
                        key={collab.name}
                        onClick={() => setSelected(selected?.name === collab.name ? null : collab)}
                        className={`
                            group flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300
                            ${selected?.name === collab.name
                                ? 'bg-white/10 border-accent/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                            }
                        `}
                    >
                        {/* Avatar / Initial */}
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border
                            transition-colors duration-300
                            ${selected?.name === collab.name
                                ? 'bg-accent text-slate-900 border-accent'
                                : 'bg-gradient-to-br from-slate-700 to-slate-600 text-white border-white/20 group-hover:border-white/40'
                            }
                        `}>
                            {collab.image ? (
                                <img src={collab.image} alt={collab.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                collab.name.charAt(0)
                            )}
                        </div>

                        <div className="text-left">
                            <span className={`block text-xs font-bold transition-colors ${selected?.name === collab.name ? 'text-white' : 'text-slate-300'}`}>
                                {collab.name}
                                {collab.status && (
                                    <span className="relative flex h-2 w-2 ml-2 inline-block">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${collab.status.color === 'green' ? 'bg-emerald-400' :
                                            collab.status.color === 'red' ? 'bg-red-400' :
                                                'bg-blue-400'
                                            }`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${collab.status.color === 'green' ? 'bg-emerald-500' :
                                            collab.status.color === 'red' ? 'bg-red-500' :
                                                'bg-blue-500'
                                            }`}></span>
                                    </span>
                                )}
                            </span>
                            {collab.role && (
                                <span className="block text-[10px] text-slate-500 uppercase tracking-wider">{collab.role}</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Expanded Bio Card */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="overflow-hidden w-full max-w-md"
                    >
                        <div className="mt-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 w-4 h-4 bg-slate-900 border-t border-l border-white/10 rotate-45"></div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl text-slate-500 shrink-0 border border-white/5">
                                    {selected.image ? (
                                        <img src={selected.image} alt={selected.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <i className="fa-solid fa-user"></i>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">{selected.name}</h4>
                                    <p className="text-accent text-xs uppercase tracking-wider mb-2">{selected.role}</p>

                                    {selected.status && (
                                        <div className={`
                                            inline-flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide mb-3 border
                                            ${selected.status.color === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                selected.status.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                                        `}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${selected.status.color === 'green' ? 'bg-emerald-500' :
                                                    selected.status.color === 'red' ? 'bg-red-500' :
                                                        'bg-blue-500'} animate-pulse`}></span>
                                            {selected.status.text}
                                        </div>
                                    )}
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        {selected.description || "Talented economist and data analyst. Contributed significantly to the research design and empirical strategy of this project."}
                                    </p>

                                    <div className="flex gap-3">
                                        {selected.links?.linkedin && (
                                            <a href={selected.links.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors text-xs font-bold border border-[#0077b5]/20">
                                                <i className="fa-brands fa-linkedin"></i> LinkedIn
                                            </a>
                                        )}
                                        {selected.links?.github && (
                                            <a href={selected.links.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors text-xs font-bold border border-white/10">
                                                <i className="fa-brands fa-github"></i> GitHub
                                            </a>
                                        )}
                                        {selected.links?.website && (
                                            <a href={selected.links.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-bold border border-emerald-500/20">
                                                <i className="fa-solid fa-globe"></i> Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
