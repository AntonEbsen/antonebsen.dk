import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignalVoiceProps {
    url: string;
    lang?: 'da' | 'en';
}

export default function SignalVoice({ url, lang = 'da' }: SignalVoiceProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const t = {
        da: { label: "Lyt til resuméet", error: "Kunne ikke indlæse lyd" },
        en: { label: "Listen to summary", error: "Could not load audio" }
    };

    const labels = t[lang] || t.da;

    useEffect(() => {
        console.log("SignalVoice URL:", url);
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setCurrentTime(audio.currentTime);
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setError(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        const handleError = () => {
            console.error("Audio playback error");
            setError(true);
            setIsPlaying(false);
        };

        // If metadata is already loaded
        if (audio.readyState >= 1) {
            setDuration(audio.duration);
        }

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [url]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time) || time === 0) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-full px-4 py-2 backdrop-blur-md group/voice hover:border-accent/30 transition-all duration-500">
            <audio ref={audioRef} src={url} preload="metadata" />

            <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
                <AnimatePresence mode="wait">
                    {isPlaying ? (
                        <motion.i
                            key="pause"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fa-solid fa-pause text-sm"
                        />
                    ) : (
                        <motion.i
                            key="play"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fa-solid fa-play text-[10px] ml-0.5"
                        />
                    )}
                </AnimatePresence>
            </button>

            <div className="flex flex-col gap-1 min-w-[120px]">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80 group-hover/voice:text-accent transition-colors">
                        {error ? labels.error : labels.label}
                    </span>
                    <span className="text-[9px] font-mono text-dim">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-accent"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                    />
                </div>
            </div>

            {/* Visualizer bars */}
            <div className="flex items-end gap-0.5 h-3 ml-2">
                {[0, 1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        className="w-0.5 bg-accent/40 rounded-full"
                        animate={{
                            height: isPlaying ? [2, 12, 4, 8, 2][(i + Math.floor(Math.random() * 5)) % 5] : 2
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 0.6 + (i * 0.1),
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
