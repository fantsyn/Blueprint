import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  inset?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddings = {
  none: "",
  sm: "p-3.5",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export function Card({
  className,
  elevated,
  inset,
  padding = "md",
  interactive,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)]",
        inset ? "glass-inset" : elevated ? "glass-elevated" : "glass",
        paddings[padding],
        interactive &&
          "transition-all duration-200 hover:border-border-strong cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3 mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[13px] font-medium tracking-tight text-primary",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-tertiary mt-0.5 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}
