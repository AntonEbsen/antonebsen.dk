import React, { useEffect, useState } from 'react';
import { ACHIEVEMENTS, getGameState, type GameState } from '../../lib/gamification';

export default function TrophyRoom() {
    const [isOpen, setIsOpen] = useState(false);
    const [state, setState] = useState<GameState | null>(null);

    useEffect(() => {
        // Initial Load
        setState(getGameState());

        // Listen for toggle event
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggle-trophy-room', handleToggle);

        // Listen for updates
        const handleUpdate = () => setState(getGameState());
        window.addEventListener('achievement-unlocked', handleUpdate);
        window.addEventListener('xp-gain', handleUpdate);

        return () => {
            window.removeEventListener('toggle-trophy-room', handleToggle);
            window.removeEventListener('achievement-unlocked', handleUpdate);
            window.removeEventListener('xp-gain', handleUpdate);
        };
    }, []);

    if (!isOpen || !state) return null;

    const totalXP = state.xp;
    const level = state.level;
    const nextLevelXP = level * 1000;
    const progress = (totalXP % 1000) / 1000 * 100;

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl bg-[#0a0a0c] border border-gold-500/20 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.1)] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">

                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-gold-500/10 to-transparent flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                            <i className="fa-solid fa-trophy text-gold-500"></i>
                            Trophy Room
                        </h2>
                        <p className="text-sm text-dim">Level {level} • {totalXP} XP</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-dim hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/5 w-full">
                    <div className="h-full bg-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 scrollbar-thin scrollbar-thumb-white/10">
                    {ACHIEVEMENTS.map(achievement => {
                        const isUnlocked = state.unlockedAchievements.includes(achievement.id);

                        return (
                            <div
                                key={achievement.id}
                                className={`relative p-4 rounded-xl border transition-all duration-300 group
                            ${isUnlocked
                                        ? 'bg-gold-500/5 border-gold-500/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
                                        : 'bg-white/[0.02] border-white/[0.05] opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                    }
                        `}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-inner
                                ${isUnlocked ? 'bg-gradient-to-br from-gold-500 to-amber-700 text-white' : 'bg-white/5 text-white/20'}
                            `}>
                                        <i className={achievement.icon}></i>
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                                            {achievement.title}
                                        </h3>
                                        <p className="text-xs text-dim leading-relaxed">
                                            {isUnlocked ? achievement.description : "Locked..."}
                                        </p>
                                        <div className="mt-2 text-[10px] font-mono opacity-50">
                                            {achievement.xp} XP
                                        </div>
                                    </div>
                                </div>

                                {/* Lock Icon Overlay for locked items */}
                                {!isUnlocked && (
                                    <div className="absolute top-2 right-2 text-white/10 text-xs">
                                        <i className="fa-solid fa-lock"></i>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
