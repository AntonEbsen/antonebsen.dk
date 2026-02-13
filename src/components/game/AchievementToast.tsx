import React, { useState, useEffect } from 'react';
import { GAME_EVENTS, type Achievement } from '../../lib/gamification';

export const AchievementToast: React.FC = () => {
    const [queue, setQueue] = useState<Achievement[]>([]);
    const [visible, setVisible] = useState<Achievement | null>(null);

    useEffect(() => {
        const handleUnlock = (e: any) => {
            const achievement = e.detail as Achievement;
            setQueue(prev => [...prev, achievement]);
        };

        window.addEventListener(GAME_EVENTS.UNLOCK, handleUnlock);
        return () => window.removeEventListener(GAME_EVENTS.UNLOCK, handleUnlock);
    }, []);

    useEffect(() => {
        if (!visible && queue.length > 0) {
            const next = queue[0];
            setVisible(next);
            setQueue(prev => prev.slice(1));

            // Auto hide after 4 seconds
            setTimeout(() => {
                setVisible(null);
            }, 4000);
        }
    }, [queue, visible]);

    if (!visible) return null;

    return (
        <div className="fixed top-24 right-4 z-[100] animate-slide-in-right">
            <div className="bg-neutral-900/90 border border-yellow-500/50 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-4 max-w-sm pointer-events-none select-none overflow-hidden relative">

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] animate-shine"></div>

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-xl shadow-lg border-2 border-yellow-200">
                    <i className={visible.icon}></i>
                </div>

                <div>
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-0.5">Achievement Unlocked</p>
                    <h4 className="font-bold text-lg leading-tight">{visible.title}</h4>
                    <p className="text-neutral-400 text-xs mt-1">{visible.description}</p>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1 bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-yellow-500 border border-yellow-500/20">
                    <span>+{visible.xp} XP</span>
                </div>
            </div>
        </div>
    );
};
