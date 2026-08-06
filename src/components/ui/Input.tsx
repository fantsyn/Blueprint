"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, mono, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-medium text-secondary tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 w-full rounded-[var(--radius-md)] bg-inset px-3.5",
            "border border-border text-sm text-primary placeholder:text-muted",
            "transition-all duration-200 ease-[var(--ease-out)]",
            "hover:border-border-strong hover:bg-elevated/60",
            "focus:border-cyan/40 focus:bg-elevated focus:outline-none focus:ring-2 focus:ring-cyan/15",
            mono && "font-num",
            error && "border-[rgba(196,122,106,0.45)] focus:border-[rgba(196,122,106,0.55)] focus:ring-[rgba(196,122,106,0.12)]",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <span className="text-[11px] text-muted leading-snug">{hint}</span>
        )}
        {error && (
          <span className="text-[11px] text-danger leading-snug">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
