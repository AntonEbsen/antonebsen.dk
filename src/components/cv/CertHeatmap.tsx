import React, { useMemo } from 'react';

interface Cert {
    date: string; // "YYYY-MM-DD" or "Month Year" or "Year"
    title: string;
}

interface Props {
    certifications: Cert[];
}

export default function CertHeatmap({ certifications }: Props) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Process Data: Bucket by Month-Year for the last 12-24 months? 
    // Or just a simple "Year" grid?
    // Let's do a simple Year-Month grid for the current year + previous year.

    const activityData = useMemo(() => {
        const data: Record<string, number> = {}; // "2024-01": 2

        certifications.forEach(c => {
            // Try to parse date
            const d = new Date(c.date);
            if (!isNaN(d.getTime())) {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                data[key] = (data[key] || 0) + 1;
            }
        });
        return data;
    }, [certifications]);

    // Generate Grid for last 12 months in reverse? 
    // Usually heatmaps are horizontal.
    // Let's do a simple row of boxes for the current year (2024, 2025, 2026).
    const years = [2023, 2024, 2025, 2026];

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="flex gap-8 min-w-max">
                {years.map(year => (
                    <div key={year} className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-dim uppercase">{year}</span>
                        <div className="grid grid-cols-4 gap-1">
                            {/* 12 months in a 4x3 or 6x2 grid? Let's do 1 row of 12 boxes for simplicity if space allows, or 3 rows of 4 */}
                            <div className="grid grid-rows-3 grid-flow-col gap-1">
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const monthStr = String(i + 1).padStart(2, '0');
                                    const key = `${year}-${monthStr}`;
                                    const count = activityData[key] || 0;

                                    // Heatmap Colors
                                    let bgClass = "bg-white/5";
                                    if (count === 1) bgClass = "bg-yellow-900/40";
                                    if (count === 2) bgClass = "bg-yellow-700/60";
                                    if (count >= 3) bgClass = "bg-yellow-500";

                                    return (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-sm ${bgClass}`}
                                            title={`${months[i]} ${year}: ${count} certs`}
                                        ></div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-[10px] text-dim flex gap-2 items-center">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-sm bg-white/5"></div>
                    <div className="w-2 h-2 rounded-sm bg-yellow-900/40"></div>
                    <div className="w-2 h-2 rounded-sm bg-yellow-700/60"></div>
                    <div className="w-2 h-2 rounded-sm bg-yellow-500"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
