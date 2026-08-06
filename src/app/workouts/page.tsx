"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { useJournalStore } from "@/store/useJournalStore";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ManualLogSheet, type LogKind } from "@/components/log/ManualLogSheet";
import { ChevronLeft, ChevronRight, Plus, Dumbbell } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import {
  dailyMealTotals,
  mealsForDate,
  workoutsForDate,
} from "@/lib/journal/insights";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";

export default function WorkoutsPage() {
  const { ready, profile } = useHydratedProfile();
  const journal = useJournalStore((s) => s.journal);
  const deleteWorkout = useJournalStore((s) => s.deleteWorkout);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [sheet, setSheet] = useState<LogKind | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const workoutDates = useMemo(() => {
    const s = new Set(journal.workouts.map((w) => w.date));
    return s;
  }, [journal.workouts]);

  const mealDates = useMemo(() => {
    return new Set(journal.meals.map((m) => m.date));
  }, [journal.meals]);

  if (!ready || !profile) {
    return <LoadingScreen />;
  }

  const dayWorkouts = workoutsForDate(journal, selected);
  const dayMeals = mealsForDate(journal, selected);
  const dayTotals = dailyMealTotals(journal, selected);
  const daySteps = journal.steps.filter((s) => s.date === selected);
  const dayWeight = journal.weights.filter((w) => w.date === selected);

  // pad calendar to week start Monday-ish using Sunday start for simplicity
  const firstDow = days[0].getDay(); // 0 Sun
  const blanks = Array.from({ length: firstDow }, (_, i) => i);

  return (
    <AppShell>
      <PageHeader
        eyebrow="History"
        title="Workouts"
        description="Calendar of sessions, meals, and check-ins — every date remembered."
        action={
          <Button size="sm" onClick={() => setSheet("workout")}>
            <Plus className="h-3.5 w-3.5" />
            Log
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-[var(--radius-sm)] text-tertiary hover:text-primary hover:bg-hover"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium text-primary">
            {format(month, "MMMM yyyy")}
          </p>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-[var(--radius-sm)] text-tertiary hover:text-primary hover:bg-hover"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] text-muted py-1 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map((b) => (
            <div key={`b-${b}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const hasW = workoutDates.has(key);
            const hasM = mealDates.has(key);
            const isSel = key === selected;
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "aspect-square rounded-[var(--radius-sm)] flex flex-col items-center justify-center text-xs transition-colors relative",
                  isSel
                    ? "bg-cyan/20 text-cyan border border-cyan/40"
                    : "text-secondary hover:bg-hover border border-transparent",
                  !isSameMonth(day, month) && "opacity-40",
                  isToday && !isSel && "text-primary"
                )}
              >
                <span className="font-num">{format(day, "d")}</span>
                <span className="flex gap-0.5 mt-0.5 h-1">
                  {hasW && (
                    <span className="h-1 w-1 rounded-full bg-cyan" />
                  )}
                  {hasM && (
                    <span className="h-1 w-1 rounded-full bg-steel" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> Session
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-steel" /> Meal
          </span>
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-primary">
          {format(parseISO(selected), "EEEE, d MMM")}
        </h2>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSheet("meal")}
          >
            + Meal
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSheet("workout")}
          >
            + Workout
          </Button>
        </div>
      </div>

      {/* Day detail */}
      <div className="space-y-3 mb-8">
        {dayWeight.map((w) => (
          <Card key={w.id} padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Weight
            </p>
            <p className="font-num text-lg text-primary">
              {formatNumber(w.weightKg, 1)} kg
            </p>
          </Card>
        ))}

        {daySteps.map((s) => (
          <Card key={s.id} padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Steps
            </p>
            <p className="font-num text-lg text-primary">
              {formatNumber(s.steps)}
            </p>
          </Card>
        ))}

        {dayWorkouts.length === 0 &&
          dayMeals.length === 0 &&
          dayWeight.length === 0 &&
          daySteps.length === 0 && (
            <Card padding="none">
              <EmptyState
                compact
                icon={Dumbbell}
                title="Nothing logged this day"
                description="Use Coach chat or the + buttons to add a session or meal."
              />
            </Card>
          )}

        {dayWorkouts.map((w) => (
          <Card key={w.id} elevated>
            <CardHeader className="mb-2">
              <div>
                <CardTitle>{w.title || "Session"}</CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mt-1">
                  {w.durationMin != null && (
                    <span className="font-num">{w.durationMin}m</span>
                  )}
                  {w.intensity != null && (
                    <span className="font-num">RPE-ish {w.intensity}/10</span>
                  )}
                  {w.feeling && w.feeling !== "neutral" && (
                    <Badge
                      variant={w.feeling === "liked" ? "cyan" : "warning"}
                    >
                      {w.feeling}
                    </Badge>
                  )}
                  <Badge variant="muted">{w.source}</Badge>
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => deleteWorkout(w.id)}
                className="text-[11px] text-muted hover:text-[#c47a6a]"
              >
                Delete
              </button>
            </CardHeader>
            <ul className="space-y-2">
              {w.exercises.map((ex, i) => (
                <li
                  key={`${ex.name}-${i}`}
                  className="border-b border-border-subtle last:border-0 pb-2 last:pb-0"
                >
                  <p className="text-sm text-primary font-medium">{ex.name}</p>
                  <p className="font-num text-xs text-cyan mt-0.5">
                    {ex.sets
                      .map(
                        (s) =>
                          `${s.reps}${s.weightKg != null ? `@${s.weightKg}` : ""}`
                      )
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
            {w.notes && (
              <p className="mt-2 text-xs text-tertiary">{w.notes}</p>
            )}
          </Card>
        ))}

        {dayMeals.length > 0 && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Meals</CardTitle>
                <CardDescription>
                  Day total{" "}
                  <span className="font-num text-secondary">
                    {dayTotals.calories} kcal · P{dayTotals.proteinG} C
                    {dayTotals.carbsG} F{dayTotals.fatG}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <ul className="space-y-2">
              {dayMeals.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-3 text-sm border-b border-border-subtle last:border-0 pb-2"
                >
                  <div>
                    <p className="text-primary">{m.name}</p>
                    {m.description && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">
                        {m.description}
                      </p>
                    )}
                  </div>
                  <span className="font-num text-xs text-cyan shrink-0">
                    {m.macros.calories}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Recent list */}
      <h2 className="text-sm font-medium text-primary mb-3">
        Recent sessions
      </h2>
      <div className="space-y-2">
        {journal.workouts.slice(0, 12).map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setSelected(w.date)}
            className="w-full text-left glass rounded-[var(--radius-md)] px-3.5 py-3 flex items-center justify-between gap-3 hover:border-border-strong transition-colors border border-transparent"
          >
            <div className="min-w-0">
              <p className="text-sm text-primary truncate">
                {w.title || "Session"}
              </p>
              <p className="text-[11px] text-muted font-num">{w.date}</p>
            </div>
            <span className="font-num text-xs text-secondary shrink-0">
              {w.exercises.length} ex
            </span>
          </button>
        ))}
        {journal.workouts.length === 0 && (
          <p className="text-sm text-tertiary text-center py-6">
            No workouts yet — log via Coach or the + button
          </p>
        )}
      </div>

      <ManualLogSheet
        open={sheet != null}
        kind={sheet || "workout"}
        onClose={() => setSheet(null)}
      />
    </AppShell>
  );
}
