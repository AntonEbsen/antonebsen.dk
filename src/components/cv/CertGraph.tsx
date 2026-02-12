import React, { Suspense, useMemo } from 'react';

// Lazy load the heavy 3D graph library
const ForceGraph3D = React.lazy(() => import('react-force-graph-3d'));

interface Cert {
    date: string;
    title: string;
    category: string;
    issuer: string;
    skills?: string[];
}

interface Props {
    certifications: Cert[];
}

export default function CertGraph({ certifications }: Props) {
    const data = useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];

        // Central Node
        nodes.push({ id: 'me', name: 'Anton', val: 20, color: '#facc15' });

        // Categories
        const categories = [...new Set(certifications.map(c => c.category))];
        categories.forEach(cat => {
            nodes.push({ id: cat, name: cat, val: 10, color: '#60a5fa' });
            links.push({ source: 'me', target: cat });
        });

        // Certs
        certifications.forEach(c => {
            nodes.push({ id: c.title, name: c.title, val: 5, color: '#ffffff' });
            links.push({ source: c.category, target: c.title });
        });

        return { nodes, links };
    }, [certifications]);

    return (
        <div className="h-full w-full min-h-[400px] bg-black/50 rounded-xl overflow-hidden border border-white/10 relative group">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="px-3 py-1 bg-black/80 border border-yellow-500/30 rounded-full text-xs font-mono text-yellow-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Interactive Network
                </div>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center h-full w-full text-dim">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl mr-3 text-yellow-500"></i>
                    Initializing Physics Engine...
                </div>
            }>
                <ForceGraph3D
                    graphData={data}
                    nodeLabel="name"
                    nodeAutoColorBy="group"
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={d => 0.005}
                    backgroundColor="rgba(0,0,0,0)"
                    showNavInfo={false}
                    nodeRelSize={6}
                    linkColor={() => 'rgba(255,255,255,0.2)'}
                />
            </Suspense>
        </div>
    );
}
