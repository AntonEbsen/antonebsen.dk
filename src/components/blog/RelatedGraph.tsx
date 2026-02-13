import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

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

    useEffect(() => {
        fetch('/api/graph.json')
            .then(res => res.json())
            .then((fullData: GraphData) => {
                // Filter logic: Find the current post node (if exists) and its neighbors
                // For simplicity in this "lab" version, we'll just show a subset or the whole graph 
                // but zoomed in on the relevant cluster if we could identify it.
                // Since we don't have the post ID in the graph yet (it's mostly CV data),
                // we will display the "Skills" cluster which is relevant to the "AI & Data" theme.

                // Let's filter for nodes related to "Data", "Python", "Economics" if they exist
                // or just slice the data to keep it small and performant for a "mini" view.

                // For now, pass full data but we will rely on auto-zoom or just show the chaos (Simulating "The Universe")
                // In a real implementation we would filter `nodes` where `id` is in `relatedTags`.
                setData(fullData);
            });
    }, []);

    useEffect(() => {
        if (!fgRef.current) return;

        // Resize Handler
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

    return (
        <div ref={containerRef} className="w-full h-[300px] bg-[#050505] border border-white/10 rounded-xl overflow-hidden relative group">
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className="text-[10px] font-mono uppercase tracking-widest text-dim bg-black/50 px-2 py-1 rounded">
                    <i className="fa-solid fa-circle-nodes mr-1 text-accent"></i>
                    Knowledge Graph
                </span>
            </div>

            {data && (
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.width}
                    height={300}
                    graphData={data}
                    nodeLabel="id"
                    nodeColor={node => (node as Node).color || '#fff'}
                    nodeRelSize={4}
                    linkColor={() => 'rgba(255,255,255,0.1)'}
                    backgroundColor="#050505"
                    enableNodeDrag={false}
                    enableZoomInteraction={false} // Static view
                    onEngineStop={() => fgRef.current.zoomToFit(400)}
                />
            )}
        </div>
    );
}
