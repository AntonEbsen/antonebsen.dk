import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

const data = [
    { year: '2019', inflation: 1.2, rate: 0.0, taylor: 0.5 },
    { year: '2020', inflation: 0.5, rate: 0.0, taylor: -1.0 },
    { year: '2021', inflation: 3.1, rate: 0.0, taylor: 2.5 },
    { year: '2022', inflation: 8.5, rate: 2.5, taylor: 9.0 },
    { year: '2023', inflation: 5.5, rate: 4.5, taylor: 6.5 },
    { year: '2024', inflation: 2.4, rate: 4.5, taylor: 4.0 },
];

export default function TaylorRuleChart() {
    return (
        <div className="w-full h-[400px] my-10 bg-[#0a0a0c] border border-white/10 rounded-xl p-4 shadow-2xl relative overflow-hidden group">

            {/* Header */}
            <div className="flex justify-between items-start mb-6 px-2">
                <div>
                    <h3 className="text-white font-bold">Taylor Rule vs. Actual Rate</h3>
                    <p className="text-xs text-dim mt-1">Estimating optimal policy interest rates based on Inflation & Output Gap.</p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold-400"></span>
                        <span className="text-dim">Actual Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span className="text-dim">Taylor Rule (Implied)</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="80%">
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTaylor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="year"
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#aaa', marginBottom: '5px' }}
                    />

                    {/* Taylor Rule Area */}
                    <Area type="monotone" dataKey="taylor" stroke="#60a5fa" fillOpacity={1} fill="url(#colorTaylor)" strokeWidth={2} name="Taylor Rule" />

                    {/* Actual Rate Line */}
                    <Line type="stepAfter" dataKey="rate" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Actual Policy Rate" />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
