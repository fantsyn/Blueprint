import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "py-8 px-4" : "py-12 px-6",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-elevated/80">
          <Icon className="h-4 w-4 text-steel" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-medium text-primary tracking-tight">{title}</p>
      {description && (
        <p className="mt-1.5 text-xs text-tertiary leading-relaxed max-w-[260px]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
