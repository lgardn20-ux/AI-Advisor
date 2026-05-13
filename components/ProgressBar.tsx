import { cn } from '@/lib/utils';

interface ProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function ProgressBar({
  completed,
  total,
  label,
  showCount = true,
  size = 'md',
  color = 'bg-primary',
  className,
}: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const trackH = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showCount) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showCount && (
            <span className="ml-auto text-sm text-muted-foreground tabular-nums">
              {completed}<span className="text-border mx-0.5">/</span>{total}{' '}
              <span className="text-xs font-semibold text-foreground">({pct}%)</span>
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-secondary overflow-hidden', trackH)}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
