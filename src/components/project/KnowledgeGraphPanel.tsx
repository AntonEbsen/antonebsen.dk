import React, { Suspense, lazy, useState } from 'react';

/**
 * A click-to-load wrapper around GalaxyGraph.
 *
 * The 3D graph pulls react-force-graph-3d and three.js — about 1.2 MB — and it
 * used to mount `client:only`, so every visitor downloaded it on page load for a
 * decorative panel most never scroll to. This wrapper is server-rendered and
 * near-weightless; the graph is fetched only when someone asks for it.
 *
 * The lazy import also keeps three.js out of SSR, which is why the graph needed
 * `client:only` in the first place.
 */
const GalaxyGraph = lazy(() => import('../common/GalaxyGraph'));

interface Node { id: string; group: number; radius?: number }
interface Link { source: string; target: string; value: number }

interface Props {
    nodes: Node[];
    links: Link[];
    height?: number;
    lang?: 'da' | 'en';
}

const copy = {
    da: {
        show: 'Vis citationsnetværk',
        loading: 'Indlæser 3D-grafen…',
        works: 'værker',
        connections: 'forbindelser',
        note: 'Grafen er interaktiv og henter et 3D-bibliotek på omkring 1,2 MB. Den indlæses først, når du beder om den.',
    },
    en: {
        show: 'Show citation network',
        loading: 'Loading the 3D graph…',
        works: 'works',
        connections: 'connections',
        note: 'The graph is interactive and pulls in a 3D library of roughly 1.2 MB. It loads only when you ask for it.',
    },
};

export default function KnowledgeGraphPanel({ nodes, links, height = 500, lang = 'en' }: Props) {
    const [shown, setShown] = useState(false);
    const t = copy[lang] ?? copy.en;

    if (shown) {
        return (
            <Suspense
                fallback={
                    <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
                        <i className="fa-solid fa-circle-notch fa-spin mr-3"></i> {t.loading}
                    </div>
                }
            >
                <GalaxyGraph nodes={nodes} links={links} height={height} />
            </Suspense>
        );
    }

    return (
        <div
            className="flex flex-col items-center justify-center text-center px-8 relative overflow-hidden"
            style={{ height }}
        >
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-amber-400/10 rounded-full blur-[60px]"></div>
                <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]"></div>
            </div>

            <div className="relative z-10">
                <div className="flex items-baseline justify-center gap-6 mb-6">
                    <div>
                        <span className="block text-3xl font-bold text-white tabular-nums">{nodes.length}</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted">{t.works}</span>
                    </div>
                    <span className="text-muted">·</span>
                    <div>
                        <span className="block text-3xl font-bold text-white tabular-nums">{links.length}</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted">{t.connections}</span>
                    </div>
                </div>

                <button
                    onClick={() => setShown(true)}
                    className="bg-white/5 hover:bg-accent hover:text-black border border-white/10 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-3 mx-auto"
                >
                    <i className="fa-solid fa-circle-nodes"></i> {t.show}
                </button>

                <p className="text-[10px] text-muted mt-5 max-w-xs mx-auto leading-relaxed">{t.note}</p>
            </div>
        </div>
    );
}
