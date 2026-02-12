import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Course {
    title: string;
    level: string;
    tag: string;
    prerequisites?: string[];
    period?: string;
    verifiedSkills?: string[];
}

interface ConceptNetworkProps {
    courses: Course[];
    lang: 'da' | 'en';
}

const ConceptNetwork: React.FC<ConceptNetworkProps> = ({ courses, lang }) => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [highlightedSkill, setHighlightedSkill] = useState<string | null>(null);

    useEffect(() => {
        const handleHighlight = (e: any) => {
            setHighlightedSkill(e.detail.skill);
        };
        window.addEventListener('skillHighlight', handleHighlight);
        return () => window.removeEventListener('skillHighlight', handleHighlight);
    }, []);

    // 1. Process Data into Nodes and Links
    const { nodes, links } = useMemo(() => {
        const validCourses = courses.filter(c => c.level !== 'certification');

        const nodeMap = new Map<string, any>();
        validCourses.forEach((c, i) => {
            // Calculate a stable position based on level and index
            let layer = 0;
            if (c.level === 'hhx') layer = 0;
            else if (c.level === 'bachelor') layer = 2; // Mid-way for search finding
            else if (c.level === 'master') layer = 4;

            // Refine layer based on period if possible (F23 < E23 < F24 etc)
            // For simplicity, we'll use a fixed col/row approach first
            nodeMap.set(c.title, { ...c, id: c.title });
        });

        const links: { source: string; target: string }[] = [];
        validCourses.forEach(c => {
            if (c.prerequisites) {
                c.prerequisites.forEach(pre => {
                    if (nodeMap.has(pre)) {
                        links.push({ source: pre, target: c.title });
                    }
                });
            }
        });

        // Simple Layered Layout
        const layers: Record<string, string[]> = {
            'hhx': [],
            'bachelor': [],
            'master': []
        };

        validCourses.forEach(c => {
            if (layers[c.level]) layers[c.level].push(c.title);
        });

        const finalNodes = validCourses.map(c => {
            const levelIdx = c.level === 'hhx' ? 0 : c.level === 'bachelor' ? 1 : 2;
            const brotherIdx = layers[c.level].indexOf(c.title);
            const brotherCount = layers[c.level].length;

            return {
                ...c,
                x: (levelIdx * 250) + 50,
                y: (brotherIdx * 60) + 50 + (levelIdx === 1 ? 0 : (600 - (brotherCount * 60)) / 2)
            };
        });

        return { nodes: finalNodes, links };
    }, [courses]);

    // 2. Identify active links and nodes based on hover OR skill highlight
    const activeNodes = useMemo(() => {
        if (!hoveredNode && !highlightedSkill) return new Set();
        const active = new Set<string>();

        if (highlightedSkill) {
            nodes.forEach(n => {
                if (n.verifiedSkills?.includes(highlightedSkill)) {
                    active.add(n.title);
                }
            });
            // If we have a skill highlight, we don't necessarily want ancestry logic 
            // unless the user also hovers. We'll keep it simple: skill highlight shows matching courses.
        }

        if (hoveredNode) {
            active.add(hoveredNode);
            // Find all ancestors
            const findParents = (title: string) => {
                links.forEach(l => {
                    if (l.target === title) {
                        active.add(l.source);
                        findParents(l.source);
                    }
                });
            };

            // Find all descendants
            const findChildren = (title: string) => {
                links.forEach(l => {
                    if (l.source === title) {
                        active.add(l.target);
                        findChildren(l.target);
                    }
                });
            };

            findParents(hoveredNode);
            findChildren(hoveredNode);
        }

        return active;
    }, [hoveredNode, highlightedSkill, links, nodes]);

    const activeLinks = useMemo(() => {
        if (!hoveredNode && !highlightedSkill) return new Set();
        return links.filter(l => activeNodes.has(l.source) && activeNodes.has(l.target));
    }, [hoveredNode, highlightedSkill, activeNodes, links]);

    return (
        <div className="relative w-full overflow-x-auto py-12 px-4 no-scrollbar bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm mb-16">
            <div className="min-w-[800px] h-[600px] relative mx-auto">
                <svg className="w-full h-full pointer-events-none overflow-visible">
                    {/* Defs for gradients/shadows */}
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Render Links */}
                    {links.map((link, i) => {
                        const source = nodes.find(n => n.title === link.source);
                        const target = nodes.find(n => n.title === link.target);
                        if (!source || !target) return null;

                        const isActive = hoveredNode && activeNodes.has(link.source) && activeNodes.has(link.target);
                        const isRelated = hoveredNode && (link.source === hoveredNode || link.target === hoveredNode);

                        return (
                            <motion.path
                                key={`${link.source}-${link.target}`}
                                d={`M ${source.x + 10} ${source.y} C ${source.x + 130} ${source.y}, ${target.x - 130} ${target.y}, ${target.x - 10} ${target.y}`}
                                fill="none"
                                stroke={isActive ? "var(--accent)" : "rgba(255,255,255,0.05)"}
                                strokeWidth={isActive ? 2 : 1}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: isActive ? 1 : ((hoveredNode || highlightedSkill) ? 0.02 : 0.3)
                                }}
                                transition={{ duration: 0.5, delay: i * 0.01 }}
                            />
                        );
                    })}

                    {/* Render Nodes */}
                    {nodes.map((node) => {
                        const isActive = activeNodes.has(node.title);
                        const isMain = hoveredNode === node.title;
                        const isDimmed = hoveredNode && !isActive;

                        return (
                            <g
                                key={node.title}
                                className="cursor-pointer pointer-events-auto"
                                onMouseEnter={() => setHoveredNode(node.title)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={isMain ? 6 : 4}
                                    fill={isMain ? "var(--accent)" : (isActive ? "var(--accent)" : "rgba(255,255,255,0.2)")}
                                    animate={{
                                        r: isMain ? 8 : (isActive ? 6 : 4),
                                        opacity: isDimmed ? 0.2 : 1,
                                        scale: isMain ? 1.2 : 1
                                    }}
                                    filter={isActive ? "url(#glow)" : "none"}
                                />
                                <motion.text
                                    x={node.x}
                                    y={node.y - 12}
                                    textAnchor="middle"
                                    className="text-[10px] font-mono tracking-tighter fill-white/60"
                                    animate={{
                                        opacity: isDimmed ? 0.05 : (isActive || !(hoveredNode || highlightedSkill) ? 1 : 0.2),
                                        fill: isMain ? "var(--accent)" : (isActive ? "white" : "rgba(255,255,255,0.4)"),
                                        y: isMain ? node.y - 16 : node.y - 12
                                    }}
                                >
                                    {node.title.length > 30 ? node.title.substring(0, 27) + "..." : node.title}
                                </motion.text>
                            </g>
                        );
                    })}
                </svg>

                {/* Legend/Info Overlay */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                    <h3 className="text-accent text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        Den Røde Tråd
                    </h3>
                    <p className="text-white/40 text-[10px]">
                        {lang === 'da' ? 'Hold musen over et fag for at se den faglige sammenhæng' : 'Hover over a course to see the conceptual network'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConceptNetwork;
