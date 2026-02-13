import React, { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ForceGraph2D = React.lazy(() => import('react-force-graph-2d'));

interface Node {
    id: string;
    group: string;
    val: number;
    color: string;
    url?: string;
}

interface Link {
    source: string;
    target: string;
    value: number;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

export default function EcosystemGraph() {
    const [data, setData] = useState<GraphData | null>(null);
    const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
    const [hoverNode, setHoverNode] = useState<any>(null);
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetch('/api/ecosystem.json')
            .then(res => res.json())
            .then(setData)
            .catch(err => console.error('Failed to load ecosystem graph', err));

        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: 500
                });
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNodeClick = (node: any) => {
        if (node.url) {
            window.location.href = node.url;
        }
    };

    if (!isMounted) return <div className="w-full h-[500px] bg-[#050505] rounded-3xl border border-white/5 animate-pulse" />;

    return (
        <div ref={containerRef} className="w-full relative group">
            <div className="absolute top-8 left-8 z-10 pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/50 mb-2 block">
                    Interactive Map
                </span>
                <h2 className="text-2xl font-black text-white mb-2">Explore the Ecosystem</h2>
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                        <span className="text-[10px] text-dim font-bold uppercase tracking-wider">Anton</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                        <span className="text-[10px] text-dim font-bold uppercase tracking-wider">Skills</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        <span className="text-[10px] text-dim font-bold uppercase tracking-wider">Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#F472B6]" />
                        <span className="text-[10px] text-dim font-bold uppercase tracking-wider">Blog</span>
                    </div>
                </div>
            </div>

            <div className="w-full h-[500px] bg-[#050505] rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-dim">Synthesizing Network...</div>}>
                    {data && (
                        <ForceGraph2D
                            ref={fgRef}
                            width={dimensions.width}
                            height={500}
                            graphData={data}
                            nodeColor={(n: any) => n.color}
                            nodeLabel={(n: any) => n.id}
                            nodeRelSize={5}
                            linkColor={() => 'rgba(255,255,255,0.05)'}
                            backgroundColor="#050505"
                            onNodeClick={handleNodeClick}
                            onNodeHover={setHoverNode}
                            cooldownTicks={100}
                            onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                            nodeCanvasObject={(node: any, ctx, globalScale) => {
                                const label = node.id;
                                const fontSize = 12 / globalScale;
                                ctx.font = `${fontSize}px Inter, system-ui`;
                                const textWidth = ctx.measureText(label).width;
                                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                                // Draw node circle
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
                                ctx.fillStyle = node.color;
                                ctx.fill();

                                // Draw ring if hovered
                                if (hoverNode === node) {
                                    ctx.beginPath();
                                    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                                    ctx.strokeStyle = '#fff';
                                    ctx.lineWidth = 1 / globalScale;
                                    ctx.stroke();
                                }

                                // Draw label
                                if (globalScale > 1.5 || node.group === 'root' || node.group === 'category') {
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillStyle = hoverNode === node ? '#fff' : 'rgba(255,255,255,0.6)';
                                    ctx.fillText(label, node.x, node.y + 10);
                                }
                            }}
                        />
                    )}
                </Suspense>

                {/* Interaction Hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-500 group-hover:opacity-0">
                    <span className="text-[10px] text-dim font-bold uppercase tracking-[0.2em] bg-black/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                        Drag to explore • Click to navigate
                    </span>
                </div>
            </div>
        </div>
    );
}
