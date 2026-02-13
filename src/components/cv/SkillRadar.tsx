import React from 'react';
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

interface Props {
    labels: string[];
    data: number[];
    label: string;
}

export default function SkillRadar({ labels, data, label }: Props) {
    const chartData = {
        labels,
        datasets: [
            {
                label,
                data,
                backgroundColor: 'rgba(212, 175, 55, 0.2)', // Accent color with opacity
                borderColor: 'rgba(212, 175, 55, 1)',
                borderWidth: 1,
                pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(212, 175, 55, 1)',
            },
        ],
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 11
                    }
                },
                ticks: {
                    backdropColor: 'transparent',
                    color: 'transparent' // Hide numbers
                }
            },
        },
        plugins: {
            legend: {
                display: false
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="w-full h-[300px] relative">
            <Radar data={chartData} options={options} />
        </div>
    );
}
