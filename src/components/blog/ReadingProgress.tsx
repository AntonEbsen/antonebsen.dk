import React, { useEffect, useState } from 'react';

export default function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (scrollTop / docHeight) * 100;
            setProgress(scrolled);
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
