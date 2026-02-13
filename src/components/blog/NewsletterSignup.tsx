import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    lang: 'da' | 'en' | 'de';
}

const translations = {
    da: {
        title: "The Signal",
        subtitle: "Hold dig opdateret på de nyeste analyser inden for Økonomi, Data og AI.",
        placeholder: "Din e-mail adresse",
        button: "Tilmeld",
        loading: "Tilmelder...",
        success: "Velkommen til Signalet!",
        error: "Der skete en fejl. Prøv igen.",
        existing: "Du er allerede tilmeldt!"
    },
    en: {
        title: "The Signal",
        subtitle: "Stay updated on the latest analysis in Economics, Data, and AI.",
        placeholder: "Your email address",
        button: "Join",
        loading: "Joining...",
        success: "Welcome to The Signal!",
        error: "Something went wrong. Try again.",
        existing: "You are already subscribed!"
    },
    de: {
        title: "The Signal",
        subtitle: "Bleiben Sie auf dem Laufenden über die neuesten Analysen in Wirtschaft, Daten und KI.",
        placeholder: "Ihre E-Mail-Adresse",
        button: "Beitreten",
        loading: "Beitreten...",
        success: "Willkommen bei The Signal!",
        error: "Etwas ist schief gelaufen. Versuchen Sie es erneut.",
        existing: "Sie sind bereits angemeldet!"
    }
};

export default function NewsletterSignup({ lang }: Props) {
    const t = translations[lang] || translations.da;
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'existing'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.message === "Du er allerede tilmeldt!") {
                    setStatus('existing');
                } else {
                    setStatus('success');
                    setEmail('');
                }
            } else {
                setStatus('error');
                setMessage(data.error || t.error);
            }
        } catch (err) {
            setStatus('error');
            setMessage(t.error);
        }
    };

    return (
        <div className="w-full relative py-12 px-4 md:px-0">
            <div className="relative max-w-4xl mx-auto overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-1 shadow-2xl">
                <div className="absolute inset-0 bg-[url('/assets/images/grid.svg')] opacity-5 pointer-events-none"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent">LIVE FEED</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                            {t.title}
                        </h2>
                        <p className="text-dim text-lg opacity-70 max-w-md mx-auto md:mx-0">
                            {t.subtitle}
                        </p>
                    </div>

                    <div className="w-full md:w-[400px]">
                        <AnimatePresence mode="wait">
                            {status === 'success' || status === 'existing' ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-accent/10 border border-accent/20 rounded-2xl p-6 text-center"
                                >
                                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
                                        <i className="fa-solid fa-check text-black"></i>
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-1">{status === 'success' ? t.success : t.existing}</h3>
                                </motion.div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t.placeholder}
                                            className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all group-hover:border-white/20"
                                            required
                                        />
                                        <div className="absolute inset-0 rounded-xl bg-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full py-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-accent hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                                    >
                                        {status === 'loading' ? t.loading : t.button}
                                    </button>
                                    {status === 'error' && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="text-red-400 text-xs font-medium text-center mt-2"
                                        >
                                            {message}
                                        </motion.p>
                                    )}
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
