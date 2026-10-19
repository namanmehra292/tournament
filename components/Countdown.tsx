"use client";

import { useEffect, useState } from "react";

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState(() => getTimeLeft(new Date(targetDate)));

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft(new Date(targetDate))), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  const units: [string, number][] = [
    ["Days", time.days],
    ["Hours", time.hours],
    ["Minutes", time.minutes],
    ["Seconds", time.seconds],
  ];

  return (
    <div className="flex gap-3 sm:gap-4">
      {units.map(([label, value]) => (
        <div
          key={label}
          className="glass-panel flex flex-col items-center justify-center px-4 py-3 sm:px-6 sm:py-4 min-w-[72px] sm:min-w-[88px]"
        >
          <span className="text-2xl sm:text-3xl font-bold tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-xs uppercase tracking-wide text-white/60 mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}
