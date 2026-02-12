import React, { useEffect, useState, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';

const SkillGraph: React.FC = () => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const fgRef = useRef<any>();

    useEffect(() => {
        fetch('/api/graph.json')
            .then(res => res.json())
            .then(data => setGraphData(data));
    }, []);

    const handleClick = (node: any) => {
        // Aim at node from outside it
        const distance = 40;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        fgRef.current.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({ x, y, z })
            3000  // ms transition duration
        );
    };

    return (
        <div className="w-full h-full">
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="id"
                nodeAutoColorBy="group"
                nodeThreeObject={(node: any) => {
                    const sprite = new SpriteText(node.id);
                    sprite.color = node.color || '#fff';
                    sprite.textHeight = node.val ? node.val / 2 : 8;
                    return sprite;
                }}
                linkWidth={1}
                linkColor={() => 'rgba(255,255,255,0.2)'}
                backgroundColor="#050505"
                onNodeClick={handleClick}
                showNavInfo={false}
                controlType="orbit"
            />
        </div>
    );
};

export default SkillGraph;
