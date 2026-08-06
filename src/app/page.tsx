"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydration } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Hexagon, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const loadDemo = useAppStore((s) => s.loadDemo);
  const setHasHydrated = useAppStore((s) => s.setHasHydrated);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) setHasHydrated(true);
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return unsub;
  }, [setHasHydrated]);

  useEffect(() => {
    if (!authHydrated) return;
    if (session) {
      router.replace(profile?.onboardingComplete ? "/today" : "/onboarding");
    }
  }, [authHydrated, session, profile, router]);

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute top-[-25%] left-1/2 -translate-x-1/2 h-[70vh] w-[90vw] max-w-3xl rounded-full opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(94,200,192,0.1) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40vh] w-[40vw] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(94,200,192,0.04) 0%, transparent 70%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-cyan/20 bg-cyan-soft">
            <Hexagon className="h-3.5 w-3.5 text-cyan" strokeWidth={1.75} />
          </div>
          <span className="text-[13px] font-medium tracking-tight text-primary">
            Blueprint
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="sm">
              Create account
            </Button>
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <div className="mb-9 flex h-14 w-14 items-center justify-center rounded-[18px] border border-cyan/20 bg-cyan-soft shadow-[0_0_48px_rgba(94,200,192,0.12)]">
            <Hexagon className="h-7 w-7 text-cyan" strokeWidth={1.4} />
          </div>

          <p className="eyebrow mb-4">Precision physique system</p>

          <h1 className="display text-[2.75rem] sm:text-6xl text-primary mb-5">
            Blueprint
          </h1>

          <p className="max-w-md text-[15px] text-secondary leading-relaxed mb-11">
            You are a living architectural plan. Metrics, physique, and goals
            become a quiet, intentional training and nutrition system.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-xs sm:max-w-none">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto min-w-[190px]">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto min-w-[140px]"
              >
                Sign in
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="mt-8 text-[12px] text-muted hover:text-secondary transition-colors tracking-wide"
            onClick={() => {
              loadDemo();
              router.push("/today");
            }}
          >
            Explore guest demo →
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.55 }}
          className="mt-20 flex flex-wrap justify-center gap-2 max-w-lg"
        >
          {[
            "AI coach logging",
            "Interactive hologram",
            "Phase nutrition",
            "Progress architecture",
          ].map((label) => (
            <span
              key={label}
              className="rounded-full border border-border-subtle bg-elevated/50 px-3.5 py-1.5 text-[11px] text-tertiary tracking-wide"
            >
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      <footer className="relative z-10 py-7 text-center text-[11px] text-muted tracking-wide">
        Designed for clarity · Dark by default
      </footer>
    </div>
  );
}
