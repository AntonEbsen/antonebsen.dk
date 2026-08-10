import React, { useEffect, useState, useRef } from 'react';
import SpriteText from 'three-spritetext';

// Lazy load ForceGraph3D because it relies on window/document (client-only)
const ForceGraph3D = React.lazy(() => import('react-force-graph-3d'));

const KnowledgeGraph: React.FC = () => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const fgRef = useRef<any>();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetch('/api/knowledge-graph.json')
            .then(res => res.json())
            .then(data => setGraphData(data));
    }, []);

    const handleClick = (node: any) => {
        // Aim at node from outside it
        const distance = 60;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        if (fgRef.current) {
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
                node, // lookAt ({ x, y, z })
                2000  // ms transition duration
            );
        }
    };

    return (
        <div className="w-full h-full">
            {isMounted && (
                <React.Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Loading Knowledge Web...</div>}>
                    <ForceGraph3D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel={(node: any) => `${node.id}${node.title ? `\n(${node.title})` : ''}`}
                        nodeThreeObject={(node: any) => {
                            const sprite = new SpriteText(node.id);
                            sprite.color = node.color || '#fff';
                            sprite.textHeight = node.val ? node.val / 2 : 5;
                            return sprite;
                        }}
                        linkWidth={1}
                        linkColor={() => 'rgba(255,255,255,0.15)'}
                        backgroundColor="#17191A"
                        onNodeClick={handleClick}
                        showNavInfo={false}
                        controlType="orbit"
                        linkDirectionalParticles={1}
                        linkDirectionalParticleSpeed={0.005}
                    />
                </React.Suspense>
            )}
        </div>
    );
};

export default KnowledgeGraph;
