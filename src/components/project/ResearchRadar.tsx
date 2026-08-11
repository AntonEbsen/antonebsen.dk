import React from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

/**
 * Labels used to be hardcoded in Danish inside this file, which is why /en/team
 * could not render it at all. Everything is a prop now, and the numeric axis is
 * shown rather than hidden — the values are counts, so the reader should be able
 * to see the scale they're counted on.
 */
interface Props {
    labels: string[];
    values: number[];
    /** Series name, shown in the tooltip. */
    seriesLabel: string;
    /** Top of the radial axis. Defaults to the largest value. */
    max?: number;
    /** Tooltip suffix, e.g. " of 4 projects". */
    unit?: string;
}

export default function ResearchRadar({ labels, values, seriesLabel, max, unit = '' }: Props) {
    const axisMax = max ?? Math.max(...values, 1);

    const data: ChartData<'radar'> = {
        labels,
        datasets: [
            {
                label: seriesLabel,
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500/20
                borderColor: 'rgba(59, 130, 246, 1)',       // blue-500
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
            },
        ],
    };

    const options: ChartOptions<'radar'> = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: {
                    color: '#94a3b8', // slate-400
                    font: { size: 12, family: 'Inter, sans-serif' },
                },
                ticks: {
                    // Shown, unlike before: these are counts, and a hidden axis
                    // turns a countable fact into an unfalsifiable impression.
                    display: true,
                    stepSize: 1,
                    color: '#64748b', // slate-500
                    backdropColor: 'transparent',
                    font: { size: 10 },
                },
                min: 0,
                max: axisMax,
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900/90
                titleColor: '#fff',
                bodyColor: '#cbd5e1', // slate-300
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (ctx) => `${ctx.formattedValue}${unit}`,
                },
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="w-full h-[300px] md:h-[400px] relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>
            <Radar data={data} options={options} />
        </div>
    );
}
