import React, { useEffect, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as d3 from 'd3';

interface Cert {
    title: string;
    category: string;
    skills?: string[];
    issuer: string;
}

interface Props {
    certifications: Cert[];
    height?: number;
}

export default function CertGraph({ certifications, height = 400 }: Props) {
    const fgRef = useRef<any>(null);

    // Transform Data into Graph
    const graphData = useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];
        const addedNodes = new Set<string>();

        // 1. Root Node
        nodes.push({ id: 'Me', group: 0, val: 20, color: '#ffffff' });
        addedNodes.add('Me');

        // 2. Categories
        const categories = Array.from(new Set(certifications.map(c => c.category)));
        categories.forEach(cat => {
            if (!addedNodes.has(cat)) {
                nodes.push({ id: cat, group: 1, val: 10, color: '#eab308' }); // Yellow-500
                addedNodes.add(cat);
                links.push({ source: 'Me', target: cat });
            }
        });

        // 3. Certs & Skills
        certifications.forEach(cert => {
            // Cert Node
            if (!addedNodes.has(cert.title)) {
                nodes.push({ id: cert.title, group: 2, val: 5, color: '#a855f7', desc: cert.issuer }); // Purple-500
                addedNodes.add(cert.title);
                // Link to Category
                links.push({ source: cert.category, target: cert.title });
            }

            // Skill Nodes
            if (cert.skills) {
                cert.skills.forEach(skill => {
                    if (!addedNodes.has(skill)) {
                        nodes.push({ id: skill, group: 3, val: 3, color: '#22d3ee' }); // Cyan-400
                        addedNodes.add(skill);
                    }
                    // Link Cert -> Skill
                    links.push({ source: cert.title, target: skill });
                });
            }
        });

        return { nodes, links };
    }, [certifications]);

    useEffect(() => {
        // Auto-rotate
        let angle = 0;
        const interval = setInterval(() => {
            if (fgRef.current) {
                angle += 0.003;
                fgRef.current.cameraPosition({
                    x: 300 * Math.sin(angle),
                    z: 300 * Math.cos(angle)
                });
            }
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-[400px] bg-black/50 border border-white/10 rounded-xl overflow-hidden shadow-inner">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-xs font-bold uppercase text-yellow-500 tracking-wider">Knowledge Galaxy</h3>
                <div className="flex gap-2 mt-1 text-[10px] text-dim">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div> Domain</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div> Cert</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-cyan-400 mr-1"></div> Skill</span>
                </div>
            </div>

            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="id"
                nodeColor="color"
                nodeVal="val"
                localScale={0.5}
                linkWidth={0.5}
                linkOpacity={0.3}
                backgroundColor="#00000000" // Transparent to show parent bg
                showNavInfo={false}
                zoomToFit={100}
                nodeResolution={16}
                // Particles
                linkDirectionalParticles={1}
                linkDirectionalParticleWidth={1}
                linkDirectionalParticleSpeed={0.005}
            />
        </div>
    );
}
