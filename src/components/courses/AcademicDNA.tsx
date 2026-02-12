import React, { useMemo } from 'react';
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

interface Course {
    title: string;
    tag: string;
    ects?: string;
    syllabus?: string[];
}

interface AcademicDNAProps {
    courses: Course[];
    lang: 'da' | 'en';
}

const AcademicDNA: React.FC<AcademicDNAProps> = ({ courses, lang }) => {
    const isDa = lang === 'da';

    // 1. Logic for Mapping Courses to Competency Axes
    const dnaData = useMemo(() => {
        const categories = [
            {
                id: 'macro',
                label: isDa ? 'Makroøkonomi' : 'Macroeconomics',
                keywords: ['Makro', 'Macro', 'Business Cycles', 'General Equilibrium', 'DSGE']
            },
            {
                id: 'quant',
                label: isDa ? 'Kvantitativ Metode' : 'Quant Methods',
                keywords: ['Metode', 'Method', 'Økonometri', 'Econometrics', 'Statistics', 'Statistik', 'Numerical Analysis']
            },
            {
                id: 'coding',
                label: isDa ? 'Kodning & AI' : 'Coding & AI',
                keywords: ['AI', 'Machine Learning', 'Python', 'MATLAB', 'GAMS', 'Coding', 'Programmering', 'Neural Networks']
            },
            {
                id: 'finance',
                label: isDa ? 'Finans' : 'Finance',
                keywords: ['Finans', 'Finance', 'Asset Pricing', 'Decision Making', 'Financial']
            },
            {
                id: 'society',
                label: isDa ? 'Samfund & Politik' : 'Society & Policy',
                keywords: ['Society', 'Samfund', 'History', 'Historie', 'Politics', 'Development', 'Policy']
            }
        ];

        const scores = categories.map(cat => {
            const totalEcts = courses.reduce((sum, course) => {
                const ects = parseFloat(course.ects || '0');
                if (isNaN(ects)) return sum;

                const isMatch = cat.keywords.some(k =>
                    course.tag.toLowerCase().includes(k.toLowerCase()) ||
                    course.title.toLowerCase().includes(k.toLowerCase()) ||
                    course.syllabus?.some(s => s.toLowerCase().includes(k.toLowerCase()))
                );

                return isMatch ? sum + ects : sum;
            }, 0);
            return totalEcts;
        });

        return { labels: categories.map(c => c.label), scores };
    }, [courses, lang]);

    const data = {
        labels: dnaData.labels,
        datasets: [
            {
                label: isDa ? 'Akademisk DNA' : 'Academic DNA',
                data: dnaData.scores,
                backgroundColor: 'rgba(var(--accent-rgb), 0.2)',
                borderColor: 'rgba(var(--accent-rgb), 0.8)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(var(--accent-rgb))',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(var(--accent-rgb))',
            },
        ],
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    font: {
                        size: 10,
                        weight: 'bold' as const,
                        family: 'Inter, system-ui, sans-serif'
                    },
                },
                ticks: {
                    display: false,
                    beginAtZero: true,
                    stepSize: 10,
                },
                suggestedMin: 0,
                suggestedMax: 40,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.formattedValue} ECTS`
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="h-full w-full flex flex-col justify-center items-center py-4">
            <div className="w-full h-64 sm:h-72">
                <Radar data={data} options={options} />
            </div>
            <div className="mt-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                    {isDa ? 'Baseret på ECTS-vægtning' : 'Based on ECTS Weighting'}
                </span>
            </div>
        </div>
    );
};

export default AcademicDNA;
