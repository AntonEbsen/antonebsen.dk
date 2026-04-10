import React from 'react';
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

interface Props {
    lang: 'da' | 'en';
}

const HistoricalIndicators: React.FC<Props> = ({ lang }) => {
    const isDa = lang === 'da';

    const t = {
        title: isDa ? "Den Store Transition" : "The Great Transition",
        subtitle: isDa ? "Realt BNP pr. indbygger (1820-2018)" : "Real GDP per Capita (1820-2018)",
        gdpLabel: isDa ? "BNP pr. indbygger (2011 US$)" : "GDP per Capita (2011 US$)",
        tfrTitle: isDa ? "Demografisk Transition" : "Demographic Transition",
        tfrSubtitle: isDa ? "Total Fertilitetsrate (TFR)" : "Total Fertility Rate (TFR)",
        source: isDa ? "Kilde: Maddison Project Database 2020 & Clio-Infra" : "Source: Maddison Project Database 2020 & Clio-Infra"
    };

    const gdpData = {
        labels: ['1820', '1850', '1870', '1900', '1913', '1929', '1950', '1973', '1990', '2018'],
        datasets: [
            {
                label: isDa ? 'Danmark' : 'Denmark',
                data: [1500, 2100, 2600, 4200, 5600, 7100, 10500, 25000, 36000, 52000],
                borderColor: '#b87333', // Copper
                backgroundColor: 'rgba(184, 115, 51, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: isDa ? 'Storbritannien' : 'United Kingdom',
                data: [2600, 3200, 4500, 6800, 7500, 8200, 11500, 21000, 29000, 42000],
                borderColor: '#94a3b8', // Silver/Slate
                backgroundColor: 'rgba(148, 163, 184, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const tfrData = {
        labels: ['1850', '1880', '1900', '1920', '1940', '1960', '1980', '2010'],
        datasets: [
            {
                label: isDa ? 'UK Fertilitet' : 'UK Fertility',
                data: [4.8, 4.6, 3.5, 2.8, 1.8, 2.7, 1.9, 1.9],
                borderColor: '#b87333',
                backgroundColor: 'rgba(184, 115, 51, 0.2)',
                borderDash: [5, 5],
                tension: 0.3
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter', size: 10 } }
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: { size: 12 },
                bodyFont: { size: 12 }
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-16">
            <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-sm" aria-label={t.subtitle}>
                <div className="mb-6">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">{t.title}</h3>
                    <p className="text-[10px] uppercase font-bold text-copper tracking-[0.2em]">{t.subtitle}</p>
                </div>
                <div className="h-[300px]">
                    <Line data={gdpData} options={chartOptions} />
                </div>
                <p className="mt-6 text-[9px] text-white/30 italic uppercase tracking-widest">{t.source}</p>
            </div>

            <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-sm" aria-label={t.tfrSubtitle}>
                <div className="mb-6">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">{t.tfrTitle}</h3>
                    <p className="text-[10px] uppercase font-bold text-copper tracking-[0.2em]">{t.tfrSubtitle}</p>
                </div>
                <div className="h-[300px]">
                    <Line data={tfrData} options={chartOptions} />
                </div>
                <div className="mt-8 p-4 bg-copper/5 border-l-2 border-copper">
                    <p className="text-[11px] text-white/60 leading-relaxed font-serif italic">
                        {isDa 
                            ? "Kliometrisk indsigt: Faldet i fertilitet i det 19. århundrede var tæt korreleret med indførelsen af arbejdsmarkedslovgivning, der begrænsede børnearbejde og øgede værdien af humankapital."
                            : "Cliometric insight: The 19th-century fertility decline was closely correlated with labor market legislation that restricted child labor and increased the return on human capital investment."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HistoricalIndicators;
