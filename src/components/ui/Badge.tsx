import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "cyan" | "steel" | "warning" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-surface/80 text-secondary border-border",
  cyan: "bg-cyan-soft text-cyan border-cyan/20",
  steel: "bg-elevated text-steel border-border-subtle",
  warning:
    "bg-[rgba(196,163,90,0.1)] text-[#c4a35a] border-[rgba(196,163,90,0.22)]",
  muted: "bg-void/60 text-muted border-border-subtle",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-[3px]",
        "text-[10px] font-medium tracking-[0.06em] uppercase",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
