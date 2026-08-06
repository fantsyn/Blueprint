"use client";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-[var(--radius-md)] bg-inset p-0.5 border border-border-subtle",
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-[calc(var(--radius-md)-2px)] font-medium transition-all duration-200 ease-[var(--ease-out)]",
              size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-[13px]",
              active
                ? "bg-surface text-primary shadow-sm border border-border"
                : "text-tertiary hover:text-secondary border border-transparent"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
