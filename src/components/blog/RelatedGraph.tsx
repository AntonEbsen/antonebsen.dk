import React, { useEffect, useState, useRef, Suspense } from 'react';
import Skeleton from '@components/ui/Skeleton';

// Dynamic import to prevent SSR issues with window/canvas
const ForceGraph2D = React.lazy(() => import('react-force-graph-2d'));

interface Node {
    id: string;
    group: number;
    val: number;
    color?: string;
}

interface Link {
    source: string;
    target: string;
    value: number;
    color?: string;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

interface RelatedGraphProps {
    currentSlug: string;
}

export default function RelatedGraph({ currentSlug }: RelatedGraphProps) {
    const [data, setData] = useState<GraphData | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetch('/api/graph.json')
            .then(res => res.json())
            .then((fullData: GraphData) => {
                setData(fullData);
            });
    }, []);

    useEffect(() => {
        if (!fgRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                setDimensions(prev => ({ ...prev, width }));
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // Was an empty grey box, indistinguishable from a component that had failed.
    if (!isMounted) {
        return (
            <div className="w-full h-[300px] rounded-card overflow-hidden border border-rule">
                <Skeleton className="w-full h-full !rounded-none" label="Indlæser videnskort" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-[300px] bg-[#17191A] border border-white/10 rounded-xl overflow-hidden relative group">
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className="text-[10px] font-mono uppercase tracking-widest text-dim bg-black/50 px-2 py-1 rounded">
                    <i className="fa-solid fa-circle-nodes mr-1 text-accent"></i>
                    Knowledge Graph
                </span>
            </div>

            {data && (
                <Suspense fallback={<Skeleton className="w-full h-full !rounded-none" label="Indlæser videnskort" />}>
                    <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={300}
                        graphData={data}
                        nodeLabel="id"
                        nodeColor={(node: any) => node.color || '#fff'}
                        nodeRelSize={4}
                        linkColor={() => 'rgba(255,255,255,0.1)'}
                        backgroundColor="#17191A"
                        enableNodeDrag={false}
                        enableZoomInteraction={false}
                        onEngineStop={() => fgRef.current?.zoomToFit(400)}
                    />
                </Suspense>
            )}
        </div>
    );
}
