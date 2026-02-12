import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LabModalProps {
    notebookPath: string;
    isOpen: boolean;
    onClose: () => void;
    lang: 'da' | 'en';
}

const LabModal: React.FC<LabModalProps> = ({ notebookPath, isOpen: initialIsOpen, onClose: initialOnClose, lang }) => {
    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState(notebookPath);

    const labUrl = `https://lab.antonebsen.dk/lab/index.html?path=${currentPath}`;

    const t = {
        da: {
            title: "Økonomisk Laboratorium",
            subtitle: "Kører analyse-kode i realtid",
            close: "Luk Lab",
            loading: "Starter JupyterLite miljø...",
            external: "Åben i nyt faneblad",
            hint: "Dette er et fuldt funktionelt Python-miljø. Du kan køre cellerne (Shift + Enter) for at reproducere resultaterne."
        },
        en: {
            title: "Economic Laboratory",
            subtitle: "Running live analysis code",
            close: "Close Lab",
            loading: "Initializing JupyterLite environment...",
            external: "Open in new tab",
            hint: "This is a fully functional Python environment. You can run cells (Shift + Enter) to reproduce the findings."
        }
    }[lang] || {
        en: {
            title: "Economic Laboratory",
            subtitle: "Running live analysis code",
            close: "Close Lab",
            loading: "Initializing JupyterLite environment...",
            external: "Open in new tab",
            hint: "This is a fully functional Python environment. You can run cells (Shift + Enter) to reproduce the findings."
        }
    }['en']; // Fallback for safety

    useEffect(() => {
        setIsOpen(initialIsOpen);
    }, [initialIsOpen]);

    useEffect(() => {
        if (notebookPath) {
            setCurrentPath(notebookPath);
        }
    }, [notebookPath]);

    useEffect(() => {
        const handleOpen = (e: any) => {
            if (e.detail?.path) {
                setCurrentPath(e.detail.path);
                setLoading(true);
            }
            setIsOpen(true);
        };
        window.addEventListener('open-lab-modal', handleOpen);
        return () => window.removeEventListener('open-lab-modal', handleOpen);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        if (initialOnClose) initialOnClose();
    };

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-slate-900/50 border-b border-white/10 p-4 flex items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center text-lg font-black">
                                <i className="fa-brands fa-python"></i>
                            </div>
                            <div>
                                <h2 className="text-white font-bold leading-none">{t.title}</h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{t.subtitle}</p>
                            </div>
                        </div>

                        <div className="hidden md:block bg-white/5 px-4 py-2 rounded-lg border border-white/5 max-w-md">
                            <p className="text-[10px] text-slate-400 font-serif italic leading-tight">
                                {t.hint}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <a
                                href={labUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                {t.external} <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            </a>
                            <button
                                onClick={handleClose}
                                className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                                {t.close}
                            </button>
                        </div>
                    </div>

                    {/* Iframe Area */}
                    <div className="flex-grow relative bg-[#1e1e1e]">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                                <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-400 font-mono text-sm animate-pulse">{t.loading}</p>
                            </div>
                        )}
                        <iframe
                            src={labUrl}
                            className="w-full h-full border-none"
                            onLoad={() => setLoading(false)}
                            title="JupyterLite Lab"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LabModal;
