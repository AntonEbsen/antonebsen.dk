import React, { useEffect, useState } from 'react';
import { unlockAchievement } from '@lib/gamification';

export default function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Latched: the scroll handler is unthrottled and unlockAchievement
        // re-reads and re-parses localStorage on every call.
        let reachedEnd = false;

        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            // A post shorter than the viewport gives docHeight <= 0, which made
            // `scrolled` NaN or Infinity — the width became the invalid `NaN%`,
            // and Infinity >= 95 would have enrolled 'explicit' on page load.
            if (docHeight <= 0) {
                setProgress(0);
                return;
            }

            const scrolled = (scrollTop / docHeight) * 100;
            setProgress(scrolled);

            if (!reachedEnd && scrolled >= 95) {
                reachedEnd = true;
                unlockAchievement('explicit');
            }
        };

        window.addEventListener('scroll', updateProgress);
        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-[3px] z-[1001] pointer-events-none">
            <div
                className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
