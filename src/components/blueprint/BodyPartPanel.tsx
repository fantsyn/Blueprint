"use client";

import { motion } from "framer-motion";
import type { BodyPartId, BodyPartScore, UserProfile } from "@/types";
import { BODY_PART_LABELS } from "@/lib/body-parts";
import { exercisesForBodyPart } from "@/lib/workout-engine";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { X, Dumbbell, Target, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BodyPartPanelProps {
  partId: BodyPartId;
  score?: BodyPartScore;
  profile: UserProfile;
  onClose: () => void;
  /** Optional delta from last physique update */
  delta?: number;
}

export function BodyPartPanel({
  partId,
  score,
  profile,
  onClose,
  delta,
}: BodyPartPanelProps) {
  const label = BODY_PART_LABELS[partId];
  const exercises = exercisesForBodyPart(
    partId,
    profile.metrics.equipment,
    profile.metrics.experience
  );

  const statusVariant =
    score?.status === "lagging"
      ? "cyan"
      : score?.status === "strong"
        ? "muted"
        : "steel";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card elevated padding="lg" className="relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-[var(--radius-md)] text-tertiary hover:text-primary hover:bg-hover transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="pr-10 mb-5">
          <div>
            <p className="eyebrow mb-1.5">Region detail</p>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CardTitle className="!text-base !tracking-tight">
                {label}
              </CardTitle>
              {score && <Badge variant={statusVariant}>{score.status}</Badge>}
            </div>
            <CardDescription>
              Why it matters · prescription · overload
            </CardDescription>
          </div>
        </CardHeader>

        {/* Score meter */}
        <div className="mb-6 glass-inset rounded-[var(--radius-md)] p-3.5">
          <div className="flex items-end justify-between mb-2.5">
            <span className="text-[11px] text-tertiary tracking-wide">
              Relative development
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-num text-2xl text-primary tabular-nums leading-none">
                {score?.score ?? "—"}
              </span>
              <span className="text-[11px] text-muted">/100</span>
              {delta != null && delta !== 0 && (
                <span
                  className={cn(
                    "font-num text-[12px] ml-1",
                    delta > 0 ? "text-cyan" : "text-warning"
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              )}
            </div>
          </div>
          <Progress
            value={score?.score ?? 0}
            size="md"
            barClassName={
              score?.status === "lagging"
                ? "from-cyan/40 to-cyan/85"
                : score?.status === "strong"
                  ? "from-steel-muted/40 to-steel-muted/70"
                  : "from-steel/30 to-steel/65"
            }
          />
        </div>

        {/* Why */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-[11px] text-secondary font-medium tracking-wide">
            <Info className="h-3.5 w-3.5 text-cyan/80" strokeWidth={1.75} />
            Assessment
          </div>
          <p className="text-[13px] text-secondary leading-relaxed">
            {score?.reason ||
              (score?.status === "lagging"
                ? `${label} is underscored relative to your frame. Progressive volume here rebalances the blueprint.`
                : score?.status === "strong"
                  ? `${label} is a relative strength. Maintain with lower priority while focus shifts elsewhere.`
                  : `${label} is developing in balance. Steady progressive overload is enough.`)}
          </p>
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-[11px] text-secondary font-medium tracking-wide">
            <Dumbbell className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
            Recommended work
          </div>
          <div className="space-y-2.5">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="rounded-[var(--radius-md)] border border-border-subtle bg-void/30 p-3.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-[13px] font-medium text-primary leading-snug">
                    {ex.name}
                  </h4>
                  <span className="font-num text-[11px] text-cyan shrink-0 tabular-nums">
                    {ex.sets} × {ex.reps}
                  </span>
                </div>
                <ul className="space-y-1 mb-2.5">
                  {ex.cues.map((cue) => (
                    <li
                      key={cue}
                      className="text-[11px] text-tertiary flex gap-1.5 leading-relaxed"
                    >
                      <span className="text-steel-muted shrink-0">·</span>
                      {cue}
                    </li>
                  ))}
                </ul>
                <div className="flex items-start gap-1.5 text-[11px] text-secondary border-t border-border-subtle pt-2">
                  <Target
                    className="h-3 w-3 mt-0.5 text-cyan/70 shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="leading-relaxed">{ex.progressiveOverload}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-5 w-full"
          onClick={onClose}
        >
          Close
        </Button>
      </Card>
    </motion.div>
  );
}
