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

                // Lectio difficilior: read through with the page still set in
                // blackletter. The class is owned by core/Scriptorium.astro.
                if (document.body.classList.contains('scriptorium-active')) {
                    unlockAchievement('lectio_difficilior');
                }

                // Reaching the end is a repeatable fact about this page load,
                // where 'explicit' is a one-off fact about the visitor. The
                // Quire needs the former — it has to count a third post read
                // long after 'explicit' stopped firing — so it gets its own
                // signal rather than listening for the unlock event.
                window.dispatchEvent(new CustomEvent('blog:reached-end'));
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
