interface ProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  color?: string;
}

export default function ProgressBar({
  completed,
  total,
  label,
  color = 'bg-blue-600',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((completed / total) * 100));
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-gray-800">
            {completed} / {total} ({pct}%)
          </span>
        </div>
      )}
      <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
