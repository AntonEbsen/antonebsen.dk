import React, { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ModelForgeProps {
    lang: 'da' | 'en';
}

const ModelForge: React.FC<ModelForgeProps> = ({ lang }) => {
    // --- STATE ---
    const [alphaPi, setAlphaPi] = useState(1.5); // Inflation weight (Standard Taylor: 1.5)
    const [alphaY, setAlphaY] = useState(0.5);   // Output gap weight (Standard Taylor: 0.5)
    const [rStar, setRStar] = useState(1.0);     // Equilibrium real rate (Natural rate)
    const [piTarget, setPiTarget] = useState(2.0); // Inflation target (ECB: 2%)

    // --- UI STRINGS ---
    const t = {
        da: {
            title: "Taylor Rule Simulator",
            subtitle: "Udforsk hvordan forskellige politiske vægtninger ville have ændret ECB's rente.",
            labelActual: "ECB Faktisk Rente (Main Refi)",
            labelTaylor: "Simuleret Taylor-rente",
            labelInflation: "Inflation",
            labelOutputGap: "Output-gap",
            controls: "Model-vægtninger",
            weightPi: "Inflations-vægt (απ)",
            weightY: "Output-gap vægt (αy)",
            naturalRate: "Naturlig rente (r*)",
            targetPi: "Inflationsmål (π*)",
            formula: "Formel: i = r* + π + απ(π - π*) + αy(y)",
            insight: "Indsigt",
            insightText: alphaPi > 2 ? "Høj inflationskontrol: Du prioriterer prisstabilitet meget aggressivt." : "Balanceret tilgang: Du følger den klassiske Taylor-regel fra 1993."
        },
        en: {
            title: "Taylor Rule Simulator",
            subtitle: "Explore how different policy weightings would have changed the ECB's interest rate.",
            labelActual: "Actual ECB Rate (Main Refi)",
            labelTaylor: "Simulated Taylor Rate",
            labelInflation: "Inflation",
            labelOutputGap: "Output Gap",
            controls: "Model Weights",
            weightPi: "Inflation Weight (απ)",
            weightY: "Output Gap Weight (αy)",
            naturalRate: "Natural Rate (r*)",
            targetPi: "Inflation Target (π*)",
            formula: "Formula: i = r* + π + απ(π - π*) + αy(y)",
            insight: "Insight",
            insightText: alphaPi > 2 ? "Hawkish: You prioritize price stability very aggressively." : "Balanced: You are following the classic 1993 Taylor rule."
        }
    }[lang];

    // --- MOCK DATA (Eurozone Macro Trends 2000-2024) ---
    const macroData = useMemo(() => [
        { year: '2000', pi: 2.1, gap: 0.5, actual: 3.75 },
        { year: '2002', pi: 2.3, gap: -0.2, actual: 3.25 },
        { year: '2004', pi: 2.1, gap: -0.8, actual: 2.00 },
        { year: '2006', pi: 2.2, gap: 1.2, actual: 3.00 },
        { year: '2008', pi: 3.3, gap: 1.0, actual: 4.00 },
        { year: '2010', pi: 1.6, gap: -3.5, actual: 1.00 },
        { year: '2012', pi: 2.5, gap: -1.5, actual: 0.75 },
        { year: '2014', pi: 0.4, gap: -2.0, actual: 0.05 },
        { year: '2016', pi: 0.2, gap: -0.5, actual: 0.00 },
        { year: '2018', pi: 1.8, gap: 0.8, actual: 0.00 },
        { year: '2020', pi: 0.3, gap: -6.5, actual: 0.00 },
        { year: '2021', pi: 2.6, gap: -1.0, actual: 0.00 },
        { year: '2022', pi: 8.4, gap: 1.5, actual: 0.50 },
        { year: '2023', pi: 5.4, gap: 0.5, actual: 4.00 },
        { year: '2024', pi: 2.4, gap: 0.0, actual: 4.50 },
    ], []);

    // --- CALCULATION ---
    // Taylor Rule: i = r* + pi + alphaPi*(pi - piTarget) + alphaY*(gap)
    const simulatedRates = useMemo(() => {
        return macroData.map(d => {
            const rate = rStar + d.pi + (alphaPi - 1) * (d.pi - piTarget) + alphaY * d.gap;
            return Math.max(rate, 0); // ELB constraint
        });
    }, [alphaPi, alphaY, rStar, piTarget, macroData]);

    // --- CHART CONFIG ---
    const chartData = {
        labels: macroData.map(d => d.year),
        datasets: [
            {
                label: t.labelActual,
                data: macroData.map(d => d.actual),
                borderColor: 'rgba(212, 175, 55, 0.4)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                borderDash: [5, 5],
                tension: 0.3,
            },
            {
                label: t.labelTaylor,
                data: simulatedRates,
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 4,
                pointRadius: 4,
                pointBackgroundColor: '#D4AF37',
                fill: true,
                tension: 0.3,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#d4d4d8', font: { family: 'Inter', size: 12 } }
            },
            tooltip: {
                backgroundColor: 'rgba(10, 10, 15, 0.9)',
                titleColor: '#D4AF37',
                bodyColor: '#fff',
                borderColor: 'rgba(212, 175, 55, 0.2)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#a1a1aa', callback: (value: any) => value + '%' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#a1a1aa' }
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    return (
        <div className="model-forge-root space-y-8">
            {/* Simulation Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart Area */}
                <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-[32px] p-8 min-h-[400px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-accent/5 rounded-full blur-[80px]"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{t.title}</h3>
                            <p className="text-sm text-slate-400">{t.subtitle}</p>
                        </div>
                        <div className="text-[10px] font-mono text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                            {t.formula}
                        </div>
                    </div>

                    <div className="h-[350px] relative z-10">
                        <Line data={chartData} options={options} />
                    </div>
                </div>

                {/* Controls Area */}
                <div className="bg-white/[0.05] border border-white/15 rounded-[32px] p-8 flex flex-col justify-between">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                <i className="fa-solid fa-sliders"></i>
                            </div>
                            <h3 className="text-lg font-bold text-white">{t.controls}</h3>
                        </div>

                        {/* Alpha Pi Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                <span className="text-slate-400">{t.weightPi}</span>
                                <span className="text-accent">{alphaPi.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="4" step="0.1"
                                value={alphaPi}
                                onChange={(e) => setAlphaPi(parseFloat(e.target.value))}
                                className="w-full accent-accent h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Alpha Y Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                <span className="text-slate-400">{t.weightY}</span>
                                <span className="text-accent">{alphaY.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="2" step="0.1"
                                value={alphaY}
                                onChange={(e) => setAlphaY(parseFloat(e.target.value))}
                                className="w-full accent-accent h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        {/* R Star Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                <span className="text-slate-400">{t.naturalRate}</span>
                                <span className="text-accent">{rStar.toFixed(2)}%</span>
                            </div>
                            <input
                                type="range"
                                min="-2" max="5" step="0.5"
                                value={rStar}
                                onChange={(e) => setRStar(parseFloat(e.target.value))}
                                className="w-full accent-accent h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fa-solid fa-lightbulb text-accent text-xs"></i>
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">{t.insight}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                {t.insightText}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelForge;
