import React, { useEffect, useState } from 'react';

interface ViewCounterProps {
    slug: string;
}

export default function ViewCounter({ slug }: ViewCounterProps) {
    const [views, setViews] = useState<number | null>(null);

    useEffect(() => {
        // Avoid double counting in strict mode
        const key = `viewed:${slug}`;
        const hasViewed = sessionStorage.getItem(key);

        if (!hasViewed) {
            // Increment
            fetch(`/api/views/${slug}`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    setViews(data.views);
                    sessionStorage.setItem(key, 'true');
                })
                .catch(err => console.error('View increment error', err));
        } else {
            // Just fetch
            fetch(`/api/views/${slug}`)
                .then(res => res.json())
                .then(data => setViews(data.views))
                .catch(err => console.error('View fetch error', err));
        }
    }, [slug]);

    if (views === null) return <span className="text-dim text-xs opacity-50">...</span>;

    return (
        <span className="flex items-center gap-1.5 text-xs font-mono text-dim opacity-80" title={`${views} views`}>
            <i className="fa-solid fa-eye text-[10px]"></i>
            {views.toLocaleString()}
        </span>
    );
}
