"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { BODY_PART_LABELS } from "@/lib/body-parts";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  use(params);
  const router = useRouter();
  const { ready, profile, agenda } = useHydratedProfile();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const session = agenda?.session;

  if (!ready || !profile || !session) {
    return <LoadingScreen />;
  }

  const allExercises = session.blocks.flatMap((b) => b.exercises);
  const total = allExercises.length;
  const done = completed.size;
  const pct = total ? (done / total) * 100 : 0;

  const toggle = (exId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href="/today"
          className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-secondary mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Today
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-primary">
              {session.title}
            </h1>
            <p className="mt-1 text-sm text-tertiary flex items-center gap-2">
              <Timer className="h-3.5 w-3.5" />
              <span className="font-num">~{session.estimatedMinutes} min</span>
            </p>
          </div>
          <Badge variant="cyan">
            <span className="font-num">
              {done}/{total}
            </span>
          </Badge>
        </div>
        <div className="mt-4">
          <Progress value={pct} size="md" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.focusParts.map((p) => (
            <Badge key={p} variant="steel">
              {BODY_PART_LABELS[p]}
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-sm text-secondary mb-6 leading-relaxed">
        {session.focusReason}
      </p>

      <div className="space-y-6">
        {session.blocks.map((block) => (
          <section key={block.name}>
            <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted mb-3">
              {block.name}
            </h2>
            <div className="space-y-2">
              {block.exercises.map((ex) => {
                const isDone = completed.has(ex.id);
                const isOpen = expanded === ex.id;
                return (
                  <Card
                    key={ex.id}
                    padding="none"
                    className={cn(
                      "overflow-hidden transition-colors",
                      isDone && "opacity-60"
                    )}
                  >
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => toggle(ex.id)}
                        className={cn(
                          "w-12 shrink-0 flex items-center justify-center border-r border-border-subtle transition-colors",
                          isDone
                            ? "bg-cyan-soft text-cyan"
                            : "text-muted hover:text-cyan hover:bg-hover"
                        )}
                        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="flex-1 text-left p-3.5 min-w-0"
                        onClick={() =>
                          setExpanded(isOpen ? null : ex.id)
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                isDone
                                  ? "text-tertiary line-through"
                                  : "text-primary"
                              )}
                            >
                              {ex.name}
                            </p>
                            <p className="font-num text-xs text-cyan mt-0.5">
                              {ex.sets} × {ex.reps}
                              <span className="text-muted ml-2">
                                rest {ex.restSec}s
                              </span>
                            </p>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted shrink-0" />
                          )}
                        </div>
                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
                            <p className="text-[11px] uppercase tracking-wider text-muted">
                              Form cues
                            </p>
                            <ul className="space-y-1">
                              {ex.cues.map((c) => (
                                <li
                                  key={c}
                                  className="text-xs text-secondary flex gap-1.5"
                                >
                                  <span className="text-steel-muted">·</span>
                                  {c}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-tertiary pt-1">
                              <span className="text-cyan">Overload: </span>
                              {ex.progressiveOverload}
                            </p>
                          </div>
                        )}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {done === total && total > 0 && (
        <div className="mt-8">
          <Card elevated className="text-center !py-6">
            <p className="text-sm text-primary font-medium mb-1">
              Session complete
            </p>
            <p className="text-xs text-tertiary mb-4">
              Log loads next session for progressive tracking.
            </p>
            <Button onClick={() => router.push("/today")}>
              Back to today
            </Button>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
