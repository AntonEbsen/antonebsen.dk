import React, { useState, useEffect } from 'react';

export default function AvailabilityStatus() {
    const [status, setStatus] = useState<{ text: string, color: string, icon: string } | null>(null);
    const [time, setTime] = useState('');

    useEffect(() => {
        const updateStatus = () => {
            // Copenhagen Time
            const dkTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Copenhagen" });
            const date = new Date(dkTime);
            const hour = date.getHours();

            // Format time string
            setTime(date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false }));

            if (hour >= 9 && hour < 17) {
                setStatus({ text: "Online / Deep Work", color: "bg-green-500", icon: "🟢" });
            } else if (hour >= 17 && hour < 23) {
                setStatus({ text: "Relaxing / Reading", color: "bg-yellow-500", icon: "🟡" });
            } else {
                setStatus({ text: "Sleeping (Reply ~8h)", color: "bg-red-500", icon: "🔴" });
            }
        };

        updateStatus();
        const interval = setInterval(updateStatus, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    if (!status) return null;

    return (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.color}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${status.color}`}></span>
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[10px] text-dim uppercase tracking-wider font-bold">Copenhagen ({time})</span>
                <span className="text-sm font-medium text-white">{status.text}</span>
            </div>
        </div>
    );
}
