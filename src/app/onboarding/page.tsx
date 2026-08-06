"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydration } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { PhotoUploadSlot } from "@/components/onboarding/PhotoUploadSlot";
import { Hexagon, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { GoalType, PhotoPose } from "@/types";
import { cn } from "@/lib/utils";

const STEPS = [
  "Identity",
  "Metrics",
  "Training",
  "Photos",
  "Goal",
  "Generate",
];

const GOALS: { value: GoalType; label: string; desc: string }[] = [
  {
    value: "recomposition",
    label: "Recomposition",
    desc: "Build muscle while refining composition",
  },
  {
    value: "build_muscle",
    label: "Build muscle",
    desc: "Prioritise hypertrophy and surplus",
  },
  {
    value: "lose_fat",
    label: "Lose fat",
    desc: "Preserve muscle through a controlled cut",
  },
  {
    value: "strength",
    label: "Strength",
    desc: "Progressive overload on main lifts",
  },
  {
    value: "athletic",
    label: "Athletic",
    desc: "Power, capacity, and balanced structure",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const session = useAuthStore((s) => s.session);
  const {
    onboarding,
    setOnboardingStep,
    updateOnboarding,
    updateMetrics,
    completeOnboarding,
    profile,
  } = useAppStore();
  const [generating, setGenerating] = useState(false);
  const step = onboarding.step;

  useEffect(() => {
    if (!authHydrated) return;
    if (!session) {
      router.replace("/register");
      return;
    }
    if (profile?.onboardingComplete) {
      router.replace("/today");
      return;
    }
    // Prefill name from account once
    if (session.name && !onboarding.name) {
      updateOnboarding({ name: session.name });
    }
  }, [authHydrated, session, profile, router, onboarding.name, updateOnboarding]);

  const next = () => setOnboardingStep(Math.min(step + 1, STEPS.length - 1));
  const back = () => setOnboardingStep(Math.max(step - 1, 0));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      completeOnboarding();
      useAuthStore.getState().persistUserBlueprint();
      router.replace("/today");
    } catch (err) {
      console.error("[onboarding] generate failed", err);
      const p = useAppStore.getState().profile;
      if (p?.onboardingComplete) {
        useAuthStore.getState().persistUserBlueprint();
        router.replace("/today");
      }
    } finally {
      setGenerating(false);
    }
  };

  if (!authHydrated || !session) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-base gap-3">
        <Hexagon className="h-5 w-5 text-cyan/70 animate-pulse-soft" strokeWidth={1.5} />
        <p className="eyebrow">Preparing</p>
      </div>
    );
  }

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-dvh flex flex-col bg-base">
      <header className="sticky top-0 z-30 border-b border-border-subtle/80 bg-base/75 backdrop-blur-2xl">
        <div className="mx-auto max-w-lg px-4 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan/20 bg-cyan-soft">
                <Hexagon className="h-3 w-3 text-cyan" strokeWidth={1.75} />
              </div>
              <span className="text-[13px] font-medium text-primary tracking-tight">
                Blueprint setup
              </span>
            </div>
            <span className="font-num text-xs text-muted">
              {step + 1}/{STEPS.length}
            </span>
          </div>
          <Progress value={progressPct} size="sm" />
          <p className="mt-2 text-[11px] text-tertiary uppercase tracking-wider">
            {STEPS[step]}
          </p>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-lg px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-xl font-medium tracking-tight mb-1">
                    Who are we building for?
                  </h2>
                  <p className="text-sm text-tertiary">
                    A name is enough to personalise your blueprint.
                  </p>
                </div>
                <Input
                  label="Name"
                  placeholder="Alex"
                  value={onboarding.name}
                  onChange={(e) => updateOnboarding({ name: e.target.value })}
                  autoFocus
                />
              </section>
            )}

            {step === 1 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-medium tracking-tight mb-1">
                    Your metrics
                  </h2>
                  <p className="text-sm text-tertiary">
                    Precision starts with accurate inputs.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Age"
                    type="number"
                    mono
                    value={onboarding.metrics.age ?? ""}
                    onChange={(e) =>
                      updateMetrics({ age: Number(e.target.value) })
                    }
                  />
                  <Select
                    label="Sex"
                    value={onboarding.metrics.sex || "male"}
                    onChange={(e) =>
                      updateMetrics({
                        sex: e.target.value as "male" | "female" | "other",
                      })
                    }
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    mono
                    value={onboarding.metrics.heightCm ?? ""}
                    onChange={(e) =>
                      updateMetrics({ heightCm: Number(e.target.value) })
                    }
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    mono
                    step="0.1"
                    value={onboarding.metrics.weightKg ?? ""}
                    onChange={(e) =>
                      updateMetrics({ weightKg: Number(e.target.value) })
                    }
                  />
                </div>
                <Input
                  label="Body fat % (optional)"
                  type="number"
                  mono
                  step="0.1"
                  hint="Improves calorie & macro precision"
                  value={onboarding.metrics.bodyFatPct ?? ""}
                  onChange={(e) =>
                    updateMetrics({
                      bodyFatPct: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </section>
            )}

            {step === 2 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-medium tracking-tight mb-1">
                    Training context
                  </h2>
                  <p className="text-sm text-tertiary">
                    Experience, equipment, and any limitations.
                  </p>
                </div>
                <Select
                  label="Experience"
                  value={onboarding.metrics.experience || "intermediate"}
                  onChange={(e) =>
                    updateMetrics({
                      experience: e.target.value as
                        | "beginner"
                        | "intermediate"
                        | "advanced",
                    })
                  }
                  options={[
                    { value: "beginner", label: "Beginner (<1 year)" },
                    {
                      value: "intermediate",
                      label: "Intermediate (1–4 years)",
                    },
                    { value: "advanced", label: "Advanced (4+ years)" },
                  ]}
                />
                <Select
                  label="Equipment access"
                  value={onboarding.metrics.equipment || "full_gym"}
                  onChange={(e) =>
                    updateMetrics({
                      equipment: e.target.value as
                        | "full_gym"
                        | "home_dumbbells"
                        | "bodyweight"
                        | "minimal",
                    })
                  }
                  options={[
                    { value: "full_gym", label: "Full gym" },
                    { value: "home_dumbbells", label: "Home dumbbells" },
                    { value: "bodyweight", label: "Bodyweight only" },
                    { value: "minimal", label: "Minimal / bands" },
                  ]}
                />
                <Input
                  label="Injuries or limitations"
                  placeholder="e.g. left shoulder impingement"
                  hint="We'll modify exercise selection"
                  value={(onboarding.metrics.injuries || [])[0] || ""}
                  onChange={(e) =>
                    updateMetrics({
                      injuries: e.target.value ? [e.target.value] : [],
                    })
                  }
                />
              </section>
            )}

            {step === 3 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-medium tracking-tight mb-1">
                    Physique captures
                  </h2>
                  <p className="text-sm text-tertiary">
                    Guided photos let us score relative development. Consistent
                    poses matter more than perfection.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["front", "side", "back"] as PhotoPose[]).map((pose) => (
                    <PhotoUploadSlot
                      key={pose}
                      pose={pose}
                      value={onboarding.photos[pose]}
                      onChange={(url) =>
                        updateOnboarding({
                          photos: { ...onboarding.photos, [pose]: url },
                        })
                      }
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted text-center">
                  Photos stay on-device for this MVP · Vision scoring optional
                </p>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-medium tracking-tight mb-1">
                    Goal & inspiration
                  </h2>
                  <p className="text-sm text-tertiary">
                    What direction should the blueprint optimise for?
                  </p>
                </div>
                <div className="space-y-2">
                  {GOALS.map((g) => {
                    const active = onboarding.goal.type === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() =>
                          updateOnboarding({
                            goal: { ...onboarding.goal, type: g.value },
                          })
                        }
                        className={cn(
                          "w-full text-left rounded-[var(--radius-md)] border p-3.5 transition-all",
                          active
                            ? "border-cyan/40 bg-cyan-soft"
                            : "border-border bg-elevated hover:border-border-strong"
                        )}
                      >
                        <p
                          className={cn(
                            "text-sm font-medium",
                            active ? "text-cyan" : "text-primary"
                          )}
                        >
                          {g.label}
                        </p>
                        <p className="text-xs text-tertiary mt-0.5">{g.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <Input
                  label="Inspiration image URLs (optional)"
                  placeholder="Paste a URL, or skip for now"
                  hint="Upload of inspo images ships next — URLs work in MVP"
                  value={onboarding.inspoUrls[0] || ""}
                  onChange={(e) =>
                    updateOnboarding({
                      inspoUrls: e.target.value ? [e.target.value] : [],
                    })
                  }
                />
              </section>
            )}

            {step === 5 && (
              <section className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan/25 bg-cyan-soft">
                    <Sparkles className="h-6 w-6 text-cyan" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-medium tracking-tight mb-2">
                    Ready to generate
                  </h2>
                  <p className="text-sm text-tertiary max-w-sm mx-auto">
                    We&apos;ll analyse your metrics
                    {Object.keys(onboarding.photos).length > 0
                      ? ", physique captures,"
                      : ""}{" "}
                    and goal into a personalised focus map, training sessions,
                    and nutrition targets.
                  </p>
                </div>

                <Card padding="md" className="space-y-2 text-sm">
                  <Row
                    label="Name"
                    value={onboarding.name || "Athlete"}
                  />
                  <Row
                    label="Body"
                    value={`${onboarding.metrics.heightCm}cm · ${onboarding.metrics.weightKg}kg`}
                  />
                  <Row
                    label="Experience"
                    value={onboarding.metrics.experience || "—"}
                  />
                  <Row
                    label="Equipment"
                    value={(onboarding.metrics.equipment || "—").replace(
                      /_/g,
                      " "
                    )}
                  />
                  <Row
                    label="Goal"
                    value={(onboarding.goal.type || "—").replace(/_/g, " ")}
                  />
                  <Row
                    label="Photos"
                    value={
                      Object.keys(onboarding.photos).length
                        ? `${Object.keys(onboarding.photos).length} poses`
                        : "Skipped"
                    }
                  />
                </Card>

                <Button
                  size="lg"
                  className="w-full"
                  loading={generating}
                  onClick={handleGenerate}
                >
                  {generating ? "Generating blueprint…" : "Generate my blueprint"}
                </Button>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step < 5 && (
        <div className="sticky bottom-0 border-t border-border-subtle bg-base/90 backdrop-blur-xl">
          <div className="mx-auto max-w-lg px-4 py-4 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={step === 0 ? () => router.push("/") : back}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={next}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
      <span className="text-tertiary text-xs uppercase tracking-wider">
        {label}
      </span>
      <span className="text-secondary capitalize">{value}</span>
    </div>
  );
}
