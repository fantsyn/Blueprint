"use client";

import Link from "next/link";
import { Hexagon } from "lucide-react";

export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh flex flex-col bg-base overflow-hidden">
      <div
        className="pointer-events-none absolute top-[-18%] left-1/2 -translate-x-1/2 h-[55vh] w-[75vw] max-w-xl rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(94,200,192,0.09) 0%, transparent 68%)",
        }}
      />

      <header className="relative z-10 px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-cyan/20 bg-cyan-soft">
            <Hexagon className="h-3.5 w-3.5 text-cyan" strokeWidth={1.75} />
          </div>
          <span className="text-[13px] font-medium text-primary group-hover:text-cyan transition-colors">
            Blueprint
          </span>
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center px-5 pb-14">
        <div className="w-full max-w-[380px] mt-8 sm:mt-14 animate-fade-up">
          <h1 className="display text-[26px] sm:text-[28px] text-primary mb-2">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-[13px] text-tertiary mb-8 leading-relaxed">
              {subtitle}
            </p>
          ) : (
            <div className="mb-8" />
          )}
          <div className="glass-elevated rounded-[var(--radius-xl)] p-5 sm:p-6">
            {children}
          </div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
