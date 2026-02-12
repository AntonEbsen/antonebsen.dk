import React, { useEffect, useState, useRef, Suspense } from 'react';
import * as d3 from 'd3';

// Lazy load ForceGraph3D because it relies on window/document (client-only)
const ForceGraph3D = React.lazy(() => import('react-force-graph-3d'));

interface Node {
    id: string;
    group: number;
    val?: number;
    radius?: number;
}

interface Link {
    source: string;
    target: string;
    value?: number;
}

interface GalaxyGraphProps {
    nodes: Node[];
    links: Link[];
    height?: number;
}

export default function GalaxyGraph({ nodes, links, height = 600 }: GalaxyGraphProps) {
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 800, h: height });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Dynamic Sizing with ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    w: entry.contentRect.width,
                    h: entry.contentRect.height
                });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Auto-rotation & Force Logic
    useEffect(() => {
        if (!isMounted || !fgRef.current) return;

        // Add radial force to keep nodes centered
        if (fgRef.current.d3Force) {
            fgRef.current.d3Force('charge').strength(-120); // Reduce repulsion slightly
            fgRef.current.d3Force('radial', d3.forceRadial(0, 0, 0).strength(0.1)); // Center pull
        }

        let angle = 0;
        const interval = setInterval(() => {
            if (fgRef.current) {
                angle += 0.003;
                fgRef.current.cameraPosition({
                    x: 200 * Math.sin(angle),
                    z: 200 * Math.cos(angle)
                });
            }
        }, 50);
        return () => clearInterval(interval);
    }, [isMounted]);

    const getNodeColor = (node: any) => {
        if (node.group === 1) return '#D4AF37'; // Gold (Thesis/Project)
        if (node.group === 2) return '#60a5fa'; // Blue (Primary Sources)
        if (node.group === 3) return '#10b981'; // Green (Secondary/Method)
        return '#94a3b8'; // Slate (Context)
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden rounded-3xl border border-white/10 shadow-2xl" style={{ minHeight: height }}>
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-4 py-2 rounded-lg border border-white/10 pointer-events-none">
                <h3 className="text-amber-400 font-bold text-xs uppercase tracking-widest">Citation Galaxy</h3>
                <p className="text-[10px] text-slate-400">Interactive 3D Network</p>
            </div>

            {isMounted && (
                <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500">Loading Galaxy...</div>}>
                    <ForceGraph3D
                        ref={fgRef}
                        width={dimensions.w}
                        height={dimensions.h}
                        graphData={{ nodes, links }}
                        nodeLabel="id"
                        nodeColor={getNodeColor}
                        nodeVal={(node: any) => node.val || node.radius || 5}
                        linkColor={() => 'rgba(255,255,255,0.15)'}
                        backgroundColor="#000000"
                        showNavInfo={false}
                        linkWidth={1}
                        linkOpacity={0.3}
                        // Particles
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={0.005}
                        linkDirectionalParticleWidth={1.5}
                        linkDirectionalParticleColor={() => '#ffffff'}
                        // Camera config
                        controlType="orbit"
                    />
                </Suspense>
            )}
        </div>
    );
}
