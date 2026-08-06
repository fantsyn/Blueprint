"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-cyan/12 text-cyan border border-cyan/30 hover:bg-cyan/20 hover:border-cyan/45 hover:text-cyan-bright shadow-[0_0_24px_rgba(94,200,192,0.08),0_1px_0_rgba(255,255,255,0.04)_inset]",
  secondary:
    "bg-surface/90 text-primary border border-border hover:bg-hover hover:border-border-strong shadow-[var(--shadow-btn)]",
  ghost:
    "bg-transparent text-secondary hover:text-primary hover:bg-hover/80 border border-transparent",
  outline:
    "bg-transparent text-primary border border-border hover:border-steel/50 hover:bg-elevated/80",
  danger:
    "bg-[rgba(196,122,106,0.1)] text-[#c47a6a] border border-[rgba(196,122,106,0.22)] hover:bg-[rgba(196,122,106,0.18)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "h-12 px-6 text-[13px] gap-2.5 rounded-[var(--radius-md)] tracking-wide",
  icon: "h-10 w-10 rounded-[var(--radius-md)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-200 ease-[var(--ease-out)]",
          "disabled:opacity-35 disabled:pointer-events-none disabled:shadow-none",
          "active:scale-[0.985]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent opacity-80" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
