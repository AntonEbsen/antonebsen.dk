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

export const data: ChartData<'radar'> = {
    labels: ['Teori', 'Empiri', 'Programmering', 'Politik', 'Formidling'],
    datasets: [
        {
            label: 'Færdigheder',
            data: [90, 85, 95, 70, 80],
            backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500/20
            borderColor: 'rgba(59, 130, 246, 1)',   // blue-500
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        },
    ],
};

export const options: ChartOptions<'radar'> = {
    scales: {
        r: {
            angleLines: {
                color: 'rgba(255, 255, 255, 0.1)',
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)',
            },
            pointLabels: {
                color: '#94a3b8', // slate-400
                font: {
                    size: 12,
                    family: 'Inter, sans-serif',
                },
            },
            ticks: {
                display: false, // Hide numeric ticks for cleaner look
                backdropColor: 'transparent',
            },
            suggestedMin: 0,
            suggestedMax: 100,
        },
    },
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900/90
            titleColor: '#fff',
            bodyColor: '#cbd5e1', // slate-300
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
        },
    },
    maintainAspectRatio: false,
};

export default function ResearchRadar() {
    return (
        <div className="w-full h-[300px] md:h-[400px] relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>
            <Radar data={data} options={options} />
        </div>
    );
}
