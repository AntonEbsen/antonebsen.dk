import React, { useMemo, useRef, useState } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { unlockAchievement } from '@lib/gamification';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import grid from '@data/rolling-window-grid.json';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Point { end: number; coef: number; se: number }
type IndexKey = 'overall' | 'economic' | 'social' | 'political';

const SERIES_COLOR: Record<IndexKey, string> = {
    overall: '239, 68, 68',
    economic: '59, 130, 246',
    social: '16, 185, 129',
    political: '245, 158, 11',
};

const copy = {
    da: {
        windowLength: 'Vindueslængde',
        years: 'år',
        index: 'Globaliseringsindeks',
        indices: { overall: 'Samlet', economic: 'Økonomisk', social: 'Social', political: 'Politisk' },
        band: 'Vis 95 %-konfidensbånd',
        yAxis: 'Koefficient på sociale overførsler',
        xAxis: 'Vinduets slutår',
        readoutTitle: 'Valgt vindue',
        significant: 'Signifikant på 5 %-niveau',
        notSignificant: 'Ikke signifikant',
        coefficient: 'Koefficient',
        stdErr: 'Standardfejl',
        window: 'Estimeret på',
        singleWindowNote:
            'Kun 10-års vinduet er offentliggjort indtil videre — det er tallene fra opgavens Tabel 5.5. Kør scripts/generate-rolling-grid.py for at tilføje flere vindueslængder; skyderen aktiveres automatisk.',
        takeaway:
            'Bemærk fortegnsskiftet. Estimeret på vinduer der slutter før 2015 er sammenhængen svag eller negativ; i vinduer domineret af observationer efter finanskrisen bliver den positiv og signifikant. Det er den samme model og de samme lande — kun perioden er en anden.',
    },
    en: {
        windowLength: 'Window length',
        years: 'years',
        index: 'Globalization index',
        indices: { overall: 'Overall', economic: 'Economic', social: 'Social', political: 'Political' },
        band: 'Show 95% confidence band',
        yAxis: 'Coefficient on social security transfers',
        xAxis: 'Window end year',
        readoutTitle: 'Selected window',
        significant: 'Significant at the 5% level',
        notSignificant: 'Not significant',
        coefficient: 'Coefficient',
        stdErr: 'Std. error',
        window: 'Estimated on',
        singleWindowNote:
            'Only the 10-year window is published so far — these are the figures from Table 5.5 of the paper. Run scripts/generate-rolling-grid.py to add more window lengths; the slider enables itself automatically.',
        takeaway:
            'Note the change of sign. Estimated on windows ending before 2015 the relationship is weak or negative; in windows dominated by post-crisis observations it turns positive and significant. Same model, same countries — only the period differs.',
    },
};

export default function RollingWindowForge({ lang = 'en' }: { lang?: 'da' | 'en' }) {
    const t = copy[lang] ?? copy.en;

    const lengths = useMemo(
        () => Object.keys(grid.windows).map(Number).sort((a, b) => a - b),
        []
    );
    const [length, setLength] = useState(lengths[0]);
    const [index, setIndex] = useState<IndexKey>('overall');
    const [showBand, setShowBand] = useState(true);
    const [selected, setSelected] = useState<number | null>(null);

    /**
     * Windows the reader has opened, as `index:sign`.
     *
     * Keyed by index rather than pooled, because "same model, same countries —
     * only the period differs" is the entire finding. A positive social window
     * next to a negative economic one is two results, not one change of sign.
     */
    const signsSeen = useRef(new Set<string>());

    const series = (grid.windows as Record<string, Record<string, Point[]>>)[String(length)][index];
    const rgb = SERIES_COLOR[index];

    // 95% band from the reported standard errors (±1.96 SE).
    const upper = series.map(p => p.coef + 1.96 * p.se);
    const lower = series.map(p => p.coef - 1.96 * p.se);

    // Read out to a screen reader in place of the canvas.
    const chartSummary = (() => {
        const first = series[0];
        const last = series[series.length - 1];
        const label = t.indices[index];
        const n = series.length;
        return lang === 'da'
            ? `Rullende ${length}-års koefficient på ${label}, ${n} vinduer. `
              + `Fra ${first.coef.toFixed(3)} i vinduet der slutter ${first.end} `
              + `til ${last.coef.toFixed(3)} i vinduet der slutter ${last.end}.`
            : `Rolling ${length}-year coefficient on ${label}, ${n} windows. `
              + `From ${first.coef.toFixed(3)} in the window ending ${first.end} `
              + `to ${last.coef.toFixed(3)} in the window ending ${last.end}.`;
    })();

    const data: ChartData<'line'> = {
        labels: series.map(p => String(p.end)),
        datasets: [
            {
                label: t.indices[index],
                data: series.map(p => p.coef),
                borderColor: `rgb(${rgb})`,
                backgroundColor: `rgba(${rgb}, 0.15)`,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3,
                order: 0,
            },
            ...(showBand
                ? [
                      {
                          label: 'upper',
                          data: upper,
                          borderColor: `rgba(${rgb}, 0.25)`,
                          backgroundColor: `rgba(${rgb}, 0.10)`,
                          borderWidth: 1,
                          pointRadius: 0,
                          fill: '+1' as const,
                          tension: 0.3,
                          order: 2,
                      },
                      {
                          label: 'lower',
                          data: lower,
                          borderColor: `rgba(${rgb}, 0.25)`,
                          borderWidth: 1,
                          pointRadius: 0,
                          fill: false as const,
                          tension: 0.3,
                          order: 2,
                      },
                  ]
                : []),
        ],
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        /*
          Pick a window by its column, not by hitting the 4px dot. Chart.js
          defaults to `nearest` with `intersect: true`, which means the readout
          below only responds to a direct hit on the marker — hard with a mouse
          and close to impossible on a touch screen, on a chart whose entire
          purpose is choosing a window to read out.
        */
        interaction: { mode: 'index', intersect: false },
        onClick: (_evt, elements) => {
            if (!elements.length) return;
            const i = elements[0].index;
            setSelected(i);

            // The Contra Entry. Math.sign(0) is 0, which is neither side.
            const sign = Math.sign(series[i].coef);
            if (!sign) return;

            signsSeen.current.add(`${index}:${sign}`);
            if (signsSeen.current.has(`${index}:1`) && signsSeen.current.has(`${index}:-1`)) {
                unlockAchievement('contra');
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#8E938B', font: { size: 10 } },
                title: { display: true, text: t.xAxis, color: '#8E938B', font: { size: 10 } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#8E938B', font: { size: 10 } },
                title: { display: true, text: t.yAxis, color: '#8E938B', font: { size: 10 } },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(30, 33, 34, 0.95)',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                displayColors: false,
                filter: item => item.datasetIndex === 0,
                callbacks: {
                    label: ctx => {
                        const p = series[ctx.dataIndex];
                        return `${t.coefficient} ${p.coef.toFixed(4)} (SE ${p.se.toFixed(4)})`;
                    },
                },
            },
        },
    };

    // Default the readout to the most recent window.
    const readout = series[selected ?? series.length - 1];
    const significant = Math.abs(readout.coef) > 1.96 * readout.se;

    return (
        <div className="bg-bg border border-white/10 rounded-3xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
                {/* Window length */}
                <div className="flex-1">
                    <label htmlFor="rwf-window-length" className="block text-[10px] uppercase font-bold tracking-widest text-muted mb-2">
                        {t.windowLength}: <span className="text-accent">{length} {t.years}</span>
                    </label>
                    <input
                        id="rwf-window-length"
                        type="range"
                        min={lengths[0]}
                        max={lengths[lengths.length - 1]}
                        step={1}
                        value={length}
                        disabled={lengths.length === 1}
                        onChange={e => {
                            const v = Number(e.target.value);
                            // Snap to a published length.
                            const nearest = lengths.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
                            setLength(nearest);
                            setSelected(null);
                        }}
                        className="w-full accent-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Index picker */}
                <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-muted mb-2">
                        {t.index}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(SERIES_COLOR) as IndexKey[]).map(k => (
                            <button
                                key={k}
                                onClick={() => { setIndex(k); setSelected(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                    index === k
                                        ? 'bg-white/10 text-white border-white/20'
                                        : 'bg-transparent text-muted border-white/5 hover:text-dim'
                                }`}
                                style={index === k ? { borderColor: `rgb(${SERIES_COLOR[k]})` } : undefined}
                            >
                                {t.indices[k]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart.js renders a bare <canvas role="img">, which a screen reader
                announces as an unlabelled image. Describe what the line actually
                does — the endpoints and the sign change are the whole finding, so
                this is the summary a sighted reader takes away too. */}
            <div className="h-[340px] mb-6">
                <Line data={data} options={options} aria-label={chartSummary} />
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-6">
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showBand}
                        onChange={e => setShowBand(e.target.checked)}
                        className="accent-blue-500"
                    />
                    {t.band}
                </label>
            </div>

            {/* Readout for the clicked (or latest) window */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted mb-3">{t.readoutTitle}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-3 items-baseline">
                    <div>
                        <span className="block text-[10px] uppercase text-muted">{t.window}</span>
                        <span className="text-sm font-bold text-white tabular-nums">
                            {readout.end - length + 1}–{readout.end}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase text-muted">{t.coefficient}</span>
                        <span className="text-2xl font-bold text-white tabular-nums">{readout.coef.toFixed(4)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase text-muted">{t.stdErr}</span>
                        <span className="text-sm font-bold text-dim tabular-nums">{readout.se.toFixed(4)}</span>
                    </div>
                    <span
                        className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${
                            significant
                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                : 'text-muted border-white/10 bg-white/5'
                        }`}
                    >
                        {significant ? t.significant : t.notSignificant}
                    </span>
                </div>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-3">{t.takeaway}</p>

            {lengths.length === 1 && (
                <p className="text-[11px] text-muted leading-relaxed border-t border-white/5 pt-3">
                    {t.singleWindowNote}
                </p>
            )}
        </div>
    );
}
