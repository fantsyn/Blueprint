import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingScreen({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-h-dvh flex flex-col items-center justify-center bg-base gap-4",
        className
      )}
    >
      <div className="relative flex h-11 w-11 items-center justify-center">
        <div className="absolute inset-0 rounded-2xl border border-cyan/15 bg-cyan-soft animate-pulse-soft" />
        <Hexagon
          className="relative h-5 w-5 text-cyan/80"
          strokeWidth={1.5}
        />
      </div>
      <p className="eyebrow animate-pulse-soft">Loading</p>
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-cyan/40 border-t-cyan",
        className
      )}
      aria-hidden
    />
  );
}
