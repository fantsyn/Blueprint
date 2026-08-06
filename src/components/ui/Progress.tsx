import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: "sm" | "md";
}

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  size = "sm",
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-inset border border-border-subtle/50",
        size === "sm" ? "h-1" : "h-1.5",
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r origin-left transition-[width] duration-500 ease-[var(--ease-out)]",
          !barClassName && "from-cyan/50 to-cyan/80",
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
