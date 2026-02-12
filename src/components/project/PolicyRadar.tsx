import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface RadarData {
    area: string;
    score: number; // 0-100
}

interface Props {
    data: RadarData[];
    lang: 'da' | 'en';
}

const PolicyRadar: React.FC<Props> = ({ data, lang }) => {
    const size = 300;
    const center = size / 2;
    const radius = size * 0.35;
    const levels = 5;

    // Calculate coordinates for a score at a given angle
    const getCoordinates = (score: number, angle: number) => {
        const factor = (score / 100) * radius;
        const x = center + factor * Math.cos(angle - Math.PI / 2);
        const y = center + factor * Math.sin(angle - Math.PI / 2);
        return { x, y };
    };

    const angles = useMemo(() => {
        return data.map((_, i) => (i * 2 * Math.PI) / data.length);
    }, [data.length]);

    const gridLines = useMemo(() => {
        const lines = [];
        for (let l = 1; l <= levels; l++) {
            const levelRadius = (l / levels) * radius;
            const points = angles.map((angle) => {
                const x = center + levelRadius * Math.cos(angle - Math.PI / 2);
                const y = center + levelRadius * Math.sin(angle - Math.PI / 2);
                return `${x},${y}`;
            });
            lines.push(points.join(' '));
        }
        return lines;
    }, [angles, radius, center]);

    const axes = useMemo(() => {
        return angles.map((angle) => {
            const x = center + radius * Math.cos(angle - Math.PI / 2);
            const y = center + radius * Math.sin(angle - Math.PI / 2);
            return { x, y };
        });
    }, [angles, radius, center]);

    const polygonPoints = useMemo(() => {
        return data.map((item, i) => {
            const { x, y } = getCoordinates(item.score, angles[i]);
            return `${x},${y}`;
        }).join(' ');
    }, [data, angles]);

    return (
        <div className="relative flex items-center justify-center bg-white/5 border border-white/10 rounded-[40px] p-8 overflow-hidden group/radar shadow-2xl backdrop-blur-sm">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent/5 blur-[100px] pointer-events-none rounded-full" />

            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10 overflow-visible">
                {/* Defs for gradients */}
                <defs>
                    <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
                    </radialGradient>
                </defs>

                {/* Grid Levels */}
                {gridLines.map((points, i) => (
                    <polygon
                        key={i}
                        points={points}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axes */}
                {axes.map((axis, i) => (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={axis.x}
                        y2={axis.y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                    />
                ))}

                {/* The Data Polygon */}
                <motion.polygon
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.2 }}
                    points={polygonPoints}
                    fill="url(#radar-gradient)"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                />

                {/* Points on the polygon */}
                {data.map((item, i) => {
                    const { x, y } = getCoordinates(item.score, angles[i]);
                    return (
                        <motion.circle
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="var(--accent)"
                            className="drop-shadow-[0_0_5px_rgba(var(--accent-rgb),1)]"
                        />
                    );
                })}

                {/* Labels */}
                {data.map((item, i) => {
                    const labelRadius = radius + 35;
                    const x = center + labelRadius * Math.cos(angles[i] - Math.PI / 2);
                    const y = center + labelRadius * Math.sin(angles[i] - Math.PI / 2);

                    return (
                        <g key={i}>
                            <text
                                x={x}
                                y={y}
                                textAnchor="middle"
                                className="fill-slate-400 text-[10px] font-bold uppercase tracking-wider font-sans"
                                dominantBaseline="middle"
                            >
                                {item.area}
                            </text>
                            <text
                                x={x}
                                y={y + 12}
                                textAnchor="middle"
                                className="fill-accent text-[9px] font-bold font-sans"
                            >
                                {item.score}%
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Sidebar Signal Decoration */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[9px] uppercase font-black tracking-[0.2em] text-accent/80">
                    {lang === 'da' ? 'Policy Relevans Matrix' : 'Policy Relevance Matrix'}
                </span>
            </div>

            <div className="absolute bottom-6 right-8 text-right">
                <p className="text-[8px] uppercase tracking-widest text-slate-600 font-bold mb-1">
                    {lang === 'da' ? 'Analytisk overførselsscore' : 'Analytical Transfer Score'}
                </p>
                <div className="flex justify-end gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-1 h-3 bg-accent/20 rounded-full" />
                    ))}
                    <div className="absolute right-0 bottom-0 w-full h-full border border-white/5 pointer-events-none rounded-[40px]" />
                </div>
            </div>
        </div>
    );
};

export default PolicyRadar;
