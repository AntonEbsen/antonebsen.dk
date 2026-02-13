import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionCounts {
    [key: string]: number;
}

interface ReactionOption {
    type: string;
    emoji: string;
    label: string;
}

interface ArticleReactionsProps {
    slug: string;
    lang?: 'da' | 'en';
}

const REACTION_OPTIONS = (lang: 'da' | 'en'): ReactionOption[] => [
    { type: 'insightful', emoji: '🧪', label: lang === 'da' ? 'Indsigtsfuldt' : 'Insightful' },
    { type: 'strong-data', emoji: '📊', label: lang === 'da' ? 'Stærk Data' : 'Strong Data' },
    { type: 'thought-provoking', emoji: '🧠', label: lang === 'da' ? 'Tankevækkende' : 'Thought-provoking' }
];

const ArticleReactions: React.FC<ArticleReactionsProps> = ({ slug, lang = 'da' }) => {
    const options = REACTION_OPTIONS(lang);
    const [counts, setCounts] = useState<ReactionCounts>({});
    const [hasReacted, setHasReacted] = useState<string | null>(null);
    const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);

    useEffect(() => {
        // Fetch initial counts
        fetch(`/api/reactions?slug=${slug}`)
            .then(res => res.json())
            .then(data => setCounts(data))
            .catch(err => console.error('Failed to fetch reactions', err));

        // Check if user already reacted (localStorage)
        const saved = localStorage.getItem(`reaction_${slug}`);
        if (saved) setHasReacted(saved);
    }, [slug]);

    const handleReaction = async (type: string, emoji: string) => {
        if (hasReacted) return;

        // Optimistic UI
        setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
        setHasReacted(type);
        localStorage.setItem(`reaction_${slug}`, type);

        // Add floating emoji
        const id = Date.now();
        setFloatingEmojis(prev => [...prev, { id, emoji }]);
        setTimeout(() => {
            setFloatingEmojis(prev => prev.filter(item => item.id !== id));
        }, 2000);

        // Save to DB
        try {
            await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, reaction_type: type })
            });
        } catch (err) {
            console.error('Failed to save reaction', err);
        }
    };

    const labels = {
        da: "Hvad synes du om indlægget?",
        en: "What did you think of the post?"
    };

    return (
        <div className="my-12 py-8 border-y border-white/5">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-6">
                {labels[lang]}
            </p>

            <div className="flex justify-center gap-4 md:gap-8 relative">
                {options.map((opt) => {
                    const count = counts[opt.type] || 0;
                    const isActive = hasReacted === opt.type;

                    return (
                        <button
                            key={opt.type}
                            onClick={() => handleReaction(opt.type, opt.emoji)}
                            disabled={!!hasReacted}
                            className={`
                                group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300
                                ${isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-white/5 border border-transparent'}
                                ${hasReacted && !isActive ? 'opacity-50 grayscale' : ''}
                            `}
                        >
                            <span className="text-2xl transition-transform group-hover:scale-125 duration-300">
                                {opt.emoji}
                            </span>

                            <span className="text-[10px] font-bold text-dim group-hover:text-white transition-colors">
                                {count}
                            </span>

                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-[#050505]"
                                    />
                                )}
                            </AnimatePresence>
                        </button>
                    );
                })}

                {/* Floating Emojis Animation Layer */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    <AnimatePresence>
                        {floatingEmojis.map(item => (
                            <motion.span
                                key={item.id}
                                initial={{ y: 0, opacity: 1, scale: 1 }}
                                animate={{ y: -100, opacity: 0, scale: 1.5 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute left-1/2 top-0 text-3xl"
                                style={{ marginLeft: '-15px' }}
                            >
                                {item.emoji}
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ArticleReactions;
