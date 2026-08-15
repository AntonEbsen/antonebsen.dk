import React, { useEffect, useState } from 'react';
import Skeleton from '@components/ui/Skeleton';

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

    // Was three literal dots. A bar the width the number will occupy keeps the
    // meta line from reflowing when the count lands.
    if (views === null) {
        return (
            <span className="inline-flex items-center">
                <Skeleton className="h-3 w-10" label="Indlæser visninger" />
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 text-xs font-mono text-dim opacity-80" title={`${views} views`}>
            <i className="fa-solid fa-eye text-[10px]"></i>
            {views.toLocaleString()}
        </span>
    );
}
