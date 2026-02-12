import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface MacroDashboardProps {
    lang: 'da' | 'en';
}

const MacroDashboard: React.FC<MacroDashboardProps> = ({ lang }) => {
    const [activeSignal, setActiveSignal] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const t = {
        da: {
            title: "SIGNALTÅRNET",
            subtitle: "REAL-TIME MAKROØKONOMISK KONTROLRUM",
            status: "SYSTEM STATUS: OPERATIONEAL",
            signals: ["RENTEPOLITIK", "INFLATION", "LIKVIDITET"],
            metrics: {
                deviation: "Afvigelse fra Taylor-regel",
                hicp: "HICP Inflationsrate (YoY)",
                m3: "M3 Pengemængde Vækst"
            }
        },
        en: {
            title: "THE SIGNAL ROOM",
            subtitle: "REAL-TIME MACROECONOMIC CONTROL CENTER",
            status: "SYSTEM STATUS: OPERATIONAL",
            signals: ["MONETARY POLICY", "INFLATION", "LIQUIDITY"],
            metrics: {
                deviation: "Taylor Rule Deviation",
                hicp: "HICP Inflation Rate (YoY)",
                m3: "M3 Money Supply Growth"
            }
        }
    }[lang];

    useEffect(() => {
        const initialLogs = lang === 'da'
            ? ["[INFO] Forbinder til ECB Statistical Data Warehouse...", "[INFO] Henter HICP-tidsserier...", "[READY] System kalibreret."]
            : ["[INFO] Connecting to ECB Statistical Data Warehouse...", "[INFO] Fetching HICP time-series...", "[READY] System calibrated."];
        setLogs(initialLogs);

        const interval = setInterval(() => {
            const newLog = lang === 'da'
                ? `[SIGNAL] Opdaterer ${t.signals[Math.floor(Math.random() * 3)]}...`
                : `[SIGNAL] Updating ${t.signals[Math.floor(Math.random() * 3)]}...`;
            setLogs(prev => [newLog, ...prev.slice(0, 4)]);
        }, 5000);

        return () => clearInterval(interval);
    }, [lang]);

    // Mock Data for Mini Charts
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { tension: 0.4 }, point: { radius: 0 } }
    };

    const policyData = {
        labels: Array(20).fill(''),
        datasets: [{
            data: [3.5, 3.8, 4.0, 4.2, 4.0, 3.5, 3.0, 3.2, 3.8, 4.5, 4.2, 4.0, 3.8, 3.5, 3.2, 3.0, 2.8, 3.0, 3.2, 3.5],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            borderWidth: 2
        }]
    };

    const inflationData = {
        labels: Array(20).fill(''),
        datasets: [{
            data: [1.2, 1.5, 2.1, 3.5, 5.2, 8.1, 10.6, 9.2, 8.5, 7.0, 6.1, 5.2, 4.1, 2.9, 2.4, 2.5, 2.2, 1.8, 2.0, 2.2],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            borderWidth: 2
        }]
    };

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-12 mb-20 overflow-hidden relative">
            {/* Decorative Grid Layer */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/10 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#ccf381]"></span>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">{t.status}</p>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic">
                            {t.title}
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">{t.subtitle}</p>
                    </div>

                    {/* Terminal Logs */}
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 w-full md:w-80 font-mono text-[10px] text-slate-400 h-24 overflow-hidden">
                        <AnimatePresence mode="popLayout">
                            {logs.map((log, i) => (
                                <motion.p
                                    key={log + i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className={i === 0 ? "text-accent" : ""}
                                >
                                    {log}
                                </motion.p>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Policy Deviation */}
                    <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl hover:border-accent/30 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{t.signals[0]}</p>
                                <h3 className="text-lg font-bold text-white leading-none">{t.metrics.deviation}</h3>
                            </div>
                            <span className="text-2xl font-black text-accent">-0.42%</span>
                        </div>
                        <div className="h-24 w-full">
                            <Line data={policyData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Inflation Pulse */}
                    <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl hover:border-accent/30 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{t.signals[1]}</p>
                                <h3 className="text-lg font-bold text-white leading-none">{t.metrics.hicp}</h3>
                            </div>
                            <span className="text-2xl font-black text-red-500">2.2%</span>
                        </div>
                        <div className="h-24 w-full">
                            <Line data={inflationData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Activity Radar / Status */}
                    <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl hover:border-accent/30 transition-all group overflow-hidden">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">SYSTEM TRANSMISSION</p>
                        <div className="space-y-4">
                            {[
                                { l: "Monetary Pass-through", v: "High", c: "bg-accent" },
                                { l: "Credit Friction", v: "Moderate", c: "bg-amber-500" },
                                { l: "Yield Curve Slope", v: "Inverted", c: "bg-red-500" }
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                                        <span className="text-slate-400">{item.l}</span>
                                        <span className="text-white">{item.v}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "70%" }}
                                            transition={{ duration: 2, delay: i * 0.2 }}
                                            className={`h-full ${item.c}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Global Stats Footer */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-8 justify-center md:justify-start">
                    {[
                        { label: "ECB Rate", val: "4.00%" },
                        { label: "US Fed Funds", val: "5.25%" },
                        { label: "EUR/USD", val: "1.082" },
                        { label: "VIX Index", val: "14.22" }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{stat.label}</span>
                            <span className="text-sm font-bold text-white tabular-nums">{stat.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MacroDashboard;
