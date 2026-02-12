import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoLink {
    label: string;
    url: string;
    icon?: string;
}

interface VideoPart {
    part: number;
    title: string;
    signal: string;
    description: string;
    youtubeId: string;
    links?: VideoLink[];
}

interface RobustnessItem {
    question: string;
    answer: string;
    category: 'econometrics' | 'intuition' | 'data';
}

interface Props {
    series: VideoPart[];
    robustness?: RobustnessItem[];
    title?: string;
    description?: string;
    briefingUrl?: string;
    lang: 'da' | 'en';
}

// Methodology Glossary for Tooltips
const MethodologyGlossary: Record<string, { da: string, en: string }> = {
    "SVAR": {
        da: "Strukturel VAR: En model der dekomponerer statistiske korrelationer til kausale chok ved brug af økonomisk struktur.",
        en: "Structural VAR: A model that decomposes statistical correlations into causal shocks using economic structure."
    },
    "Cholesky": {
        da: "En rekursiv identifikationsmetode, hvor rækkefølgen af variabler bestemmer den kausale struktur.",
        en: "A recursive identification method where the ordering of variables determines the causal structure."
    },
    "VIX": {
        da: "Markedets forventning til 30-dages volatilitet i S&P 500. Ofte brugt som proxy for global risiko.",
        en: "The market's expectation of 30-day volatility in the S&P 500. Often used as a proxy for global risk."
    },
    "IRF": {
        da: "Impulse Response Function: Viser hvordan en variabel reagerer over tid på et isoleret chok til en anden variabel.",
        en: "Impulse Response Function: Shows how a variable reacts over time to an isolated shock in another variable."
    },
    "Gearing": {
        da: "Forholdet mellem gæld og egenkapital. I denne kontekst bankernes balance-gearing.",
        en: "The ratio of debt to equity. In this context, the leverage of bank balance sheets."
    },
    "EFFR": {
        da: "Effective Federal Funds Rate: Den rentesats som amerikanske banker bruger ved lån til hinanden natten over.",
        en: "The interest rate at which US depository institutions trade federal funds with each other overnight."
    }
};

const MethodologyTooltip: React.FC<{ term: string, lang: 'da' | 'en' }> = ({ term, lang }) => {
    const info = MethodologyGlossary[term];
    if (!info) return <span>{term}</span>;

    return (
        <span className="relative group/tooltip inline-block">
            <span className="text-accent border-b border-accent/30 cursor-help hover:text-white transition-colors underline decoration-accent/20 underline-offset-4">
                {term}
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-800 border border-white/10 rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all z-50 pointer-events-none text-xs leading-relaxed text-slate-300 font-sans normal-case tracking-normal">
                {info[lang]}
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-slate-800"></span>
            </span>
        </span>
    );
};

const RobustnessAccordion: React.FC<{ items: RobustnessItem[], lang: 'da' | 'en' }> = ({ items, lang }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const labels = {
        da: { title: "Teknisk Robusthed & Refleksion", sub: "Kritiske svar på metodiske valg" },
        en: { title: "Technical Robustness & Reflection", sub: "Critical answers to methodological choices" }
    }[lang];

    return (
        <div className="mt-16 pt-16 border-t border-white/10">
            <div className="mb-8">
                <h3 className="text-2xl font-serif text-white mb-2">{labels.title}</h3>
                <p className="text-slate-500 text-sm">{labels.sub}</p>
            </div>
            <div className="space-y-4">
                {items.map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <button
                            onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            className="w-full text-left p-5 flex items-center justify-between group"
                        >
                            <span className="flex items-center gap-4">
                                <span className={`w-2 h-2 rounded-full ${item.category === 'econometrics' ? 'bg-blue-400' :
                                        item.category === 'data' ? 'bg-green-400' : 'bg-accent'
                                    }`}></span>
                                <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.question}</span>
                            </span>
                            <i className={`fa-solid fa-chevron-down text-xs text-slate-600 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}></i>
                        </button>
                        <AnimatePresence>
                            {openIndex === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-5 pb-5"
                                >
                                    <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l border-accent/20 py-1">
                                        {item.answer}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProjectMasterclass: React.FC<Props> = ({ series, robustness, title, description, briefingUrl, lang }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [watched, setWatched] = useState<number[]>([]);
    const [isClient, setIsClient] = useState(false);

    const activeVideo = series[activeIndex];

    useEffect(() => {
        setIsClient(true);
        const savedProgress = localStorage.getItem(`progress_${series[0].youtubeId}`);
        if (savedProgress) {
            setWatched(JSON.parse(savedProgress));
        }
    }, [series]);

    useEffect(() => {
        if (isClient && watched.length > 0) {
            localStorage.setItem(`progress_${series[0].youtubeId}`, JSON.stringify(watched));
        }
    }, [watched, series, isClient]);

    const markAsWatched = (part: number) => {
        if (!watched.includes(part)) {
            setWatched([...watched, part]);
        }
    };

    // Auto-mark as watched when active for more than 10 seconds (simulated)
    useEffect(() => {
        const timer = setTimeout(() => {
            markAsWatched(activeVideo.part);
        }, 10000);
        return () => clearTimeout(timer);
    }, [activeIndex]);

    const t = {
        da: {
            masterclass: "Project Masterclass",
            explore: "Udforsk serien",
            signal: "Strategisk Signal",
            content: "Indhold & Fokus",
            nowPlaying: "Spiller nu",
            next: "Næste video",
            progress: "Din fremgang",
            completed: "Gennemført",
            resources: "Metodiske ressourcer",
            downloadBriefing: "Download Executive Briefing"
        },
        en: {
            masterclass: "Project Masterclass",
            explore: "Explore the series",
            signal: "Strategic Signal",
            content: "Content & Focus",
            nowPlaying: "Now playing",
            next: "Next video",
            progress: "Your Progress",
            completed: "Completed",
            resources: "Methodological Resources",
            downloadBriefing: "Download Executive Briefing"
        }
    }[lang];

    const parseDescription = (text: string) => {
        const terms = Object.keys(MethodologyGlossary);
        const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'g');
        const parts = text.split(regex);
        return parts.map((part, i) => {
            if (terms.includes(part)) {
                return <MethodologyTooltip key={i} term={part} lang={lang} />;
            }
            return part;
        });
    };

    const progressPercent = (watched.length / series.length) * 100;

    return (
        <section className="my-24 bg-slate-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative group/masterclass">
            {/* Vanguard Series Badge - The "Perfectionist" Signal */}
            <div className="absolute top-0 left-0 z-20 pointer-events-none">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-b border-r border-white/10 px-6 py-4 rounded-br-3xl shadow-2xl flex items-center gap-4 transition-transform group-hover/masterclass:scale-[1.02] duration-500 origin-top-left">
                    <div className="relative">
                        <div className="w-10 h-10 border-2 border-accent/40 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-shield-halved text-accent text-sm"></i>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold tracking-[0.4em] text-accent/80 leading-none mb-1">
                            {lang === 'da' ? 'Vanguard Eksklusiv' : 'Vanguard Exclusive'}
                        </span>
                        <span className="text-sm font-serif text-white/90 font-bold tracking-tighter">
                            Technical Series <span className="text-slate-500 font-sans font-light underline decoration-accent/30 underline-offset-4">№ 01</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="p-8 md:p-12 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                    <div className="flex-grow">
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-accent mb-4 block">
                            {t.masterclass}
                        </span>
                        <h2 className="text-3xl md:text-5xl font-serif text-white mb-4">
                            {title || (lang === 'da' ? 'Video-serien: Fra Intuition til Metode' : 'Video Series: From Intuition to Method')}
                        </h2>
                        <p className="text-slate-400 max-w-2xl text-lg font-serif italic">
                            {description || (lang === 'da' ? 'En 7-delt serie der dissekerer de økonomiske mekanismer, SVAR-metodologi og resultaterne af min forskning.' : 'A 7-part series dissecting the economic mechanisms, SVAR methodology, and the results of my research.')}
                        </p>
                    </div>
                    {briefingUrl && (
                        <a
                            href={briefingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 backdrop-blur-sm group whitespace-nowrap"
                        >
                            <i className="fa-solid fa-file-pdf text-red-400 group-hover:scale-110 transition-transform"></i>
                            <span className="text-sm font-bold uppercase tracking-widest">{t.downloadBriefing}</span>
                        </a>
                    )}
                </div>

                {/* Overall Progress Bar */}
                <div className="mb-12 bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{t.progress}</span>
                        <span className="text-xs font-bold text-accent">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Part List - Sidebar */}
                    <div className="lg:col-span-4 space-y-3 order-2 lg:order-1">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 pl-2">
                            {t.explore}
                        </h3>
                        <div className="space-y-2">
                            {series.map((video, index) => {
                                const isWatched = watched.includes(video.part);
                                return (
                                    <button
                                        key={video.part}
                                        onClick={() => setActiveIndex(index)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group flex items-start gap-4 ${activeIndex === index
                                            ? 'bg-accent/10 border-accent shadow-lg shadow-accent/5'
                                            : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className={`text-sm font-bold mt-0.5 ${activeIndex === index ? 'text-accent' : 'text-slate-600'}`}>
                                                {video.part.toString().padStart(2, '0')}
                                            </span>
                                            {isWatched && (
                                                <i className="fa-solid fa-check-circle text-[10px] text-accent/60 mt-2"></i>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-bold transition-colors ${activeIndex === index ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                {video.title}
                                            </h4>
                                            {activeIndex === index && (
                                                <span className="text-[10px] uppercase font-bold text-accent/80 tracking-widest mt-1 block">
                                                    {t.nowPlaying}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Video Player & Info */}
                    <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
                        <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeVideo.youtubeId}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full"
                                >
                                    <iframe
                                        src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0&modestbranding=1`}
                                        title={activeVideo.title}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeVideo.part}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50" />
                                        <h5 className="text-[10px] uppercase font-bold text-accent mb-2 tracking-widest">
                                            {t.signal}
                                        </h5>
                                        <p className="text-white font-serif leading-relaxed italic">
                                            "{activeVideo.signal}"
                                        </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                        <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">
                                            {t.content}
                                        </h5>
                                        <div className="text-slate-300 text-sm leading-relaxed">
                                            {parseDescription(activeVideo.description)}
                                        </div>
                                    </div>
                                </div>

                                {activeVideo.links && activeVideo.links.length > 0 && (
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                        <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-4 tracking-widest flex items-center gap-2">
                                            <i className="fa-solid fa-link text-xs"></i>
                                            {t.resources}
                                        </h5>
                                        <div className="flex flex-wrap gap-4">
                                            {activeVideo.links.map((link, i) => (
                                                <a
                                                    key={i}
                                                    href={link.url}
                                                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-white/5"
                                                >
                                                    <i className={link.icon || "fa-solid fa-arrow-up-right-from-square"}></i>
                                                    {link.label}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Robustness FAQ */}
                        {robustness && robustness.length > 0 && (
                            <RobustnessAccordion items={robustness} lang={lang} />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProjectMasterclass;
