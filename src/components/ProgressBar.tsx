import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar = ({ value, max = 100, className, showLabel = true }: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{Math.round(percentage)}% concluído</span>
          <span>{value} / {max}</span>
        </div>
      )}
      <div className="h-3 w-full rounded-full bg-[hsl(var(--progress-bg))] overflow-hidden">
        <div
          className="h-full bg-[hsl(var(--progress-fill))] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
