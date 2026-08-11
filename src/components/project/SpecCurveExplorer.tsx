import React, { useEffect, useMemo, useState } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

interface Spec {
    coefficient: number;
    lower_ci: number;
    upper_ci: number;
    significant: boolean;
    controls: string[];
    rank: number;
}
type IndexKey = 'KOFGI' | 'KOFEcGI' | 'KOFSoGI' | 'KOFPoGI';
type Curves = Record<IndexKey, Spec[]>;

const ORDER: IndexKey[] = ['KOFGI', 'KOFEcGI', 'KOFSoGI', 'KOFPoGI'];

// The JSON stores raw column names; nobody should read "dependency_ratio" off a chart.
const CONTROL_LABELS: Record<string, { da: string; en: string }> = {
    ln_gdppc: { da: 'Log BNP pr. indbygger', en: 'Log GDP per capita' },
    inflation_cpi: { da: 'Inflation (CPI)', en: 'Inflation (CPI)' },
    deficit: { da: 'Budgetunderskud', en: 'Budget deficit' },
    debt: { da: 'Offentlig gæld', en: 'Government debt' },
    ln_population: { da: 'Log befolkning', en: 'Log population' },
    dependency_ratio: { da: 'Forsørgerkvote', en: 'Dependency ratio' },
};

const copy = {
    da: {
        index: 'Globaliseringsindeks',
        indices: { KOFGI: 'Samlet', KOFEcGI: 'Økonomisk', KOFSoGI: 'Social', KOFPoGI: 'Politisk' },
        loading: 'Henter specifikationer…',
        failed: 'Kunne ikke hente specifikationerne.',
        yAxis: 'Koefficient på sociale overførsler',
        xAxis: 'Specifikationer, sorteret efter koefficient',
        positive: 'positive',
        significant: 'signifikante',
        ofN: 'af 64',
        range: 'Spændvidde',
        readout: 'Valgt specifikation',
        controlsIn: 'Kontrolvariable inkluderet',
        noControls: 'Ingen — kun faste effekter',
        coefficient: 'Koefficient',
        ci: '95 %-interval',
        sig: 'Signifikant',
        notSig: 'Ikke signifikant',
        hint: 'Klik på en søjle for at se hvilke kontroller den specifikation indeholder.',
        allPositive:
            'Social globalisering er positiv i alle 64 specifikationer — det eneste indeks hvor fortegnet er enstemmigt. Opgaven nedtoner alligevel resultatet, fordi feedback-regressionerne peger på omvendt kausalitet.',
        caption:
            'Hver søjle er en selvstændig estimation af ligning 4.1 med en anden delmængde af de seks kontrolvariable — alle 2⁶ = 64 kombinationer.',
    },
    en: {
        index: 'Globalization index',
        indices: { KOFGI: 'Overall', KOFEcGI: 'Economic', KOFSoGI: 'Social', KOFPoGI: 'Political' },
        loading: 'Loading specifications…',
        failed: 'Could not load the specifications.',
        yAxis: 'Coefficient on social security transfers',
        xAxis: 'Specifications, ordered by coefficient',
        positive: 'positive',
        significant: 'significant',
        ofN: 'of 64',
        range: 'Range',
        readout: 'Selected specification',
        controlsIn: 'Controls included',
        noControls: 'None — fixed effects only',
        coefficient: 'Coefficient',
        ci: '95% interval',
        sig: 'Significant',
        notSig: 'Not significant',
        hint: 'Click a bar to see which controls that specification includes.',
        allPositive:
            'Social globalization is positive in all 64 specifications — the only index whose sign is unanimous. The paper still discounts the result, because the feedback regressions point to reverse causality.',
        caption:
            'Each bar is a separate estimation of equation 4.1 using a different subset of the six controls — all 2⁶ = 64 combinations.',
    },
};

export default function SpecCurveExplorer({ lang = 'en' }: { lang?: 'da' | 'en' }) {
    const t = copy[lang] ?? copy.en;

    const [curves, setCurves] = useState<Curves | null>(null);
    const [failed, setFailed] = useState(false);
    const [index, setIndex] = useState<IndexKey>('KOFGI');
    const [selected, setSelected] = useState<number | null>(null);

    // 100KB of JSON does not belong in the island bundle.
    useEffect(() => {
        let cancelled = false;
        fetch('/assets/data/spec-curves.json')
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then(d => { if (!cancelled) setCurves(d); })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, []);

    const specs = useMemo(() => {
        if (!curves) return [];
        return [...curves[index]].sort((a, b) => a.coefficient - b.coefficient);
    }, [curves, index]);

    const stats = useMemo(() => {
        if (!specs.length) return null;
        return {
            positive: specs.filter(s => s.coefficient > 0).length,
            significant: specs.filter(s => s.significant).length,
            min: Math.min(...specs.map(s => s.coefficient)),
            max: Math.max(...specs.map(s => s.coefficient)),
        };
    }, [specs]);

    if (failed) {
        return <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 text-sm text-slate-400">{t.failed}</div>;
    }
    if (!curves || !stats) {
        return <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 text-sm text-slate-500">{t.loading}</div>;
    }

    const data: ChartData<'bar' | 'line'> = {
        labels: specs.map((_, i) => String(i + 1)),
        datasets: [
            // Whiskers drawn as floating bars: [lower, upper] per specification.
            {
                type: 'bar' as const,
                label: t.ci,
                data: specs.map(s => [s.lower_ci, s.upper_ci] as unknown as number),
                backgroundColor: specs.map(s =>
                    s.significant ? 'rgba(16, 185, 129, 0.55)' : 'rgba(148, 163, 184, 0.35)'
                ),
                borderWidth: 0,
                barPercentage: 0.9,
                categoryPercentage: 1,
                order: 1,
            },
            {
                type: 'line' as const,
                label: t.coefficient,
                data: specs.map(s => s.coefficient),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgb(59, 130, 246)',
                borderWidth: 0,
                pointRadius: 2,
                pointHoverRadius: 5,
                showLine: false,
                order: 0,
            },
        ],
    };

    const options: ChartOptions<'bar' | 'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_e, els) => { if (els.length) setSelected(els[0].index); },
        scales: {
            x: {
                grid: { display: false },
                ticks: { display: false },
                title: { display: true, text: t.xAxis, color: '#64748b', font: { size: 10 } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#64748b', font: { size: 10 } },
                title: { display: true, text: t.yAxis, color: '#64748b', font: { size: 10 } },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                displayColors: false,
                filter: item => item.datasetIndex === 1,
                callbacks: {
                    title: items => `#${items[0].dataIndex + 1} / 64`,
                    label: ctx => {
                        const s = specs[ctx.dataIndex];
                        return [
                            `${t.coefficient}: ${s.coefficient.toFixed(4)}`,
                            `${t.ci}: ${s.lower_ci.toFixed(4)} … ${s.upper_ci.toFixed(4)}`,
                            s.significant ? t.sig : t.notSig,
                        ];
                    },
                },
            },
        },
    };

    const chosen = specs[selected ?? specs.length - 1];

    return (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">{t.index}</label>
                    <div className="flex flex-wrap gap-2">
                        {ORDER.map(k => (
                            <button
                                key={k}
                                onClick={() => { setIndex(k); setSelected(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                    index === k
                                        ? 'bg-white/10 text-white border-accent'
                                        : 'bg-transparent text-slate-500 border-white/5 hover:text-slate-300'
                                }`}
                            >
                                {t.indices[k]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-6 text-right">
                    <div>
                        <span className="block text-[10px] uppercase text-slate-500">{t.positive}</span>
                        <span className={`text-xl font-bold tabular-nums ${stats.positive === 64 ? 'text-emerald-400' : 'text-white'}`}>
                            {stats.positive}<span className="text-xs text-slate-500 font-normal"> {t.ofN}</span>
                        </span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase text-slate-500">{t.significant}</span>
                        <span className="text-xl font-bold text-white tabular-nums">
                            {stats.significant}<span className="text-xs text-slate-500 font-normal"> {t.ofN}</span>
                        </span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase text-slate-500">{t.range}</span>
                        <span className="text-sm font-bold text-slate-300 tabular-nums">
                            {stats.min.toFixed(3)} … {stats.max.toFixed(3)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-[320px] mb-4">
                <Chart type="bar" data={data} options={options} />
            </div>

            <p className="text-[11px] text-slate-600 mb-6">{t.hint}</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3">{t.readout}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-3 items-baseline mb-4">
                    <div>
                        <span className="block text-[10px] uppercase text-slate-500">{t.coefficient}</span>
                        <span className="text-2xl font-bold text-white tabular-nums">{chosen.coefficient.toFixed(4)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase text-slate-500">{t.ci}</span>
                        <span className="text-sm font-bold text-slate-300 tabular-nums">
                            {chosen.lower_ci.toFixed(4)} … {chosen.upper_ci.toFixed(4)}
                        </span>
                    </div>
                    <span
                        className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${
                            chosen.significant
                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                : 'text-slate-500 border-white/10 bg-white/5'
                        }`}
                    >
                        {chosen.significant ? t.sig : t.notSig}
                    </span>
                </div>
                <span className="block text-[10px] uppercase text-slate-500 mb-2">{t.controlsIn}</span>
                {chosen.controls.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">{t.noControls}</span>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {chosen.controls.map(c => (
                            <span key={c} className="text-[11px] px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">
                                {CONTROL_LABELS[c]?.[lang] ?? c}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {index === 'KOFSoGI' && (
                <p className="text-xs text-emerald-400/90 leading-relaxed mb-3">{t.allPositive}</p>
            )}
            <p className="text-[11px] text-slate-600 leading-relaxed">{t.caption}</p>
        </div>
    );
}
