import React, { useEffect, useState } from 'react';

interface CommitData {
    message: string;
    author: string;
    date: string;
    url: string;
}

export default function GithubPulse() {
    const [commit, setCommit] = useState<CommitData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        fetch('https://api.github.com/repos/AntonEbsen/Danish-West-Indies-Website/commits')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (mounted && data && data.length > 0) {
                    const latest = data[0];
                    setCommit({
                        message: latest.commit.message,
                        author: latest.commit.author.name,
                        date: latest.commit.author.date,
                        url: latest.html_url
                    });
                }
            })
            .catch(() => {
                if (mounted) setError(true);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
            
        return () => { mounted = false; };
    }, []);

    return (
        <div className="bg-card border border-rule rounded-xl p-6 shadow-sm hover:border-rule-strong transition-colors relative overflow-hidden group">
            {/* Thematic subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted flex items-center gap-2">
                    <i className="fa-brands fa-github text-text"></i> GitHub Activity Pulse
                </span>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        {!error && !loading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </span>
                    <span className="text-[10px] text-muted">{loading ? 'Fetching...' : error ? 'Offline' : 'Live Sync'}</span>
                </div>
            </div>

            <div className="relative z-10">
                {loading ? (
                    <div className="animate-pulse flex flex-col gap-2">
                        <div className="h-4 bg-white/5 rounded w-3/4"></div>
                        <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                ) : error || !commit ? (
                    <p className="text-sm text-dim italic">Unable to fetch latest activity.</p>
                ) : (
                    <a href={commit.url} target="_blank" rel="noopener noreferrer" className="block group/link">
                        <p className="text-sm text-text font-serif leading-relaxed mb-3 group-hover/link:text-amber-400/90 transition-colors line-clamp-2">
                            "{commit.message.split('\n')[0]}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-muted font-mono">
                            <span className="flex items-center gap-1.5"><i className="fa-solid fa-code-commit"></i> {commit.author}</span>
                            <time>{new Date(commit.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                        </div>
                    </a>
                )}
            </div>
        </div>
    );
}
