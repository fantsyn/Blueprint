"use client";

import { cn } from "@/lib/utils";

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  className?: string;
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  hint,
  className,
}: CheckboxProps) {
  const inputId = id || "checkbox";
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex items-start gap-3 cursor-pointer select-none group",
        className
      )}
    >
      <button
        id={inputId}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200",
          checked
            ? "border-cyan/50 bg-cyan/15 text-cyan shadow-[0_0_8px_rgba(94,200,192,0.15)]"
            : "border-border bg-inset text-transparent group-hover:border-steel/60"
        )}
      >
        <svg
          viewBox="0 0 12 12"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M2 6.5 L5 9.5 L10 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className="min-w-0">
        <span className="block text-[13px] text-secondary group-hover:text-primary transition-colors">
          {label}
        </span>
        {hint && (
          <span className="block text-[11px] text-muted mt-0.5 leading-snug">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
