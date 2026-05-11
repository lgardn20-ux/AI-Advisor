'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ targetDate, label = 'Registration opens in' }: CountdownTimerProps) {
  const target = new Date(targetDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="text-green-600 font-semibold text-sm">
        Registration window is open!
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex gap-3">
        {[
          { value: timeLeft.days, unit: 'd' },
          { value: timeLeft.hours, unit: 'h' },
          { value: timeLeft.minutes, unit: 'm' },
          { value: timeLeft.seconds, unit: 's' },
        ].map(({ value, unit }) => (
          <div key={unit} className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums text-blue-700">
              {unit === 'd' ? value : pad(value)}
            </span>
            <span className="text-xs text-gray-400">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
