'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  compact?: boolean;
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

export default function CountdownTimer({
  targetDate,
  label = 'Registration opens in',
  compact = false,
}: CountdownTimerProps) {
  const target = new Date(targetDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-success-bg border border-success-border px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm font-medium text-success">Registration is open!</span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const segments = [
    { value: timeLeft.days, unit: 'days' },
    { value: timeLeft.hours, unit: 'hrs' },
    { value: timeLeft.minutes, unit: 'min' },
    { value: timeLeft.seconds, unit: 'sec' },
  ];

  if (compact) {
    return (
      <div className="flex items-baseline gap-1 text-sm font-mono font-semibold text-foreground">
        <span>{timeLeft.days}d</span>
        <span className="text-muted-foreground">·</span>
        <span>{pad(timeLeft.hours)}h</span>
        <span className="text-muted-foreground">·</span>
        <span>{pad(timeLeft.minutes)}m</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      )}
      <div className="flex gap-3">
        {segments.map(({ value, unit }) => (
          <div key={unit} className="flex flex-col items-center gap-0.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/8 ring-1 ring-primary/12">
              <span className="text-xl font-bold tabular-nums tracking-tight text-primary"
                style={{ fontSize: '1.3rem' }}>
                {unit === 'days' ? value : pad(value)}
              </span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
