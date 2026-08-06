import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  eyebrow?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
  eyebrow,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3.5 mb-7",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="display text-[22px] sm:text-[26px] text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[13px] text-tertiary max-w-lg leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-2">{action}</div>
      )}
    </div>
  );
}
