"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { useJournalStore } from "@/store/useJournalStore";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BodySilhouette } from "@/components/blueprint/BodySilhouette";
import { formatNumber } from "@/lib/utils";
import { BODY_PART_LABELS } from "@/lib/body-parts";
import type { BodyPartId } from "@/types";
import { buildInsights } from "@/lib/journal/insights";
import { Sparkles, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function ProgressPage() {
  const { ready, profile, agenda } = useHydratedProfile();
  const journal = useJournalStore((s) => s.journal);

  const radarParts = useMemo(() => {
    if (!profile) return [];
    const ids: BodyPartId[] = [
      "shoulders",
      "chest",
      "lats",
      "biceps",
      "abs",
      "glutes",
      "quads",
      "hamstrings",
    ];
    return ids.map((id) => {
      const s = profile.bodyPartScores.find((x) => x.id === id);
      return {
        id,
        label: BODY_PART_LABELS[id],
        score: s?.score ?? 50,
      };
    });
  }, [profile]);

  const insights = useMemo(
    () => buildInsights(journal, profile),
    [journal, profile]
  );

  const weights = useMemo(
    () => [...journal.weights].sort((a, b) => a.date.localeCompare(b.date)),
    [journal.weights]
  );

  const strengthSeries = useMemo(() => {
    const byEx = new Map<
      string,
      { name: string; points: { date: string; load: number; reps: number }[] }
    >();
    for (const w of journal.workouts) {
      for (const ex of w.exercises) {
        const key = ex.name.toLowerCase();
        if (!byEx.has(key)) byEx.set(key, { name: ex.name, points: [] });
        for (const s of ex.sets) {
          if (s.weightKg != null && s.weightKg > 0) {
            byEx.get(key)!.points.push({
              date: w.date,
              load: s.weightKg,
              reps: s.reps,
            });
          }
        }
      }
    }
    return [...byEx.values()]
      .map((e) => ({
        ...e,
        points: e.points.sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .filter((e) => e.points.length >= 1)
      .sort((a, b) => b.points.length - a.points.length)
      .slice(0, 6);
  }, [journal.workouts]);

  if (!ready || !profile) {
    return <LoadingScreen />;
  }

  const weightDelta =
    weights.length >= 2
      ? weights[weights.length - 1].weightKg - weights[0].weightKg
      : 0;

  const lastPhysique = journal.physiqueUpdates[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Architecture"
        title="Progress"
        description="Insights, strength, weight, and hologram history over time."
        action={
          <div className="flex gap-2">
            <Link href="/coach">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-3.5 w-3.5" />
                Coach
              </Button>
            </Link>
            <Link href="/update">
              <Button variant="outline" size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Update
              </Button>
            </Link>
          </div>
        }
      />

      {/* Insights */}
      <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
        {insights.map((ins) => (
          <Card key={ins.id} padding="sm" className="!p-3.5">
            <div className="flex items-start gap-2 mb-1">
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                  ins.tone === "positive" && "bg-cyan shadow-[0_0_6px_var(--accent-cyan-glow)]",
                  ins.tone === "attention" && "bg-[#c4a35a]",
                  ins.tone === "neutral" && "bg-steel-muted"
                )}
              />
              <p className="text-sm font-medium text-primary">{ins.title}</p>
            </div>
            <p className="text-xs text-tertiary leading-relaxed pl-3.5">
              {ins.detail}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Body map</CardTitle>
              <CardDescription>
                Current hologram · relative development
              </CardDescription>
            </div>
          </CardHeader>
          <BodySilhouette
            scores={profile.bodyPartScores}
            focusParts={agenda?.priorityParts || []}
            compact
            showLegend
            dimNonFocus={false}
          />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Body-part radar</CardTitle>
              <CardDescription>Snapshot scores</CardDescription>
            </div>
          </CardHeader>
          <div className="flex justify-center py-2">
            <RadarChart data={radarParts} />
          </div>
        </Card>
      </div>

      {/* Weight history */}
      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle>Weight history</CardTitle>
            <CardDescription>
              {weights.length >= 2 ? (
                <>
                  Change{" "}
                  <span
                    className={cn(
                      "font-num",
                      weightDelta < 0 ? "text-cyan" : "text-secondary"
                    )}
                  >
                    {weightDelta > 0 ? "+" : ""}
                    {formatNumber(weightDelta, 1)} kg
                  </span>
                </>
              ) : (
                "Log weight via Coach or manual entry"
              )}
            </CardDescription>
          </div>
        </CardHeader>
        {weights.length === 0 ? (
          <p className="text-sm text-tertiary">No weight check-ins yet.</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-16 mb-3">
              {weights.slice(-14).map((w) => {
                const max = Math.max(...weights.map((x) => x.weightKg));
                const min = Math.min(...weights.map((x) => x.weightKg));
                const range = max - min || 1;
                const h = 20 + ((w.weightKg - min) / range) * 80;
                return (
                  <div
                    key={w.id}
                    className="flex-1 rounded-t bg-cyan/40 min-h-[4px]"
                    style={{ height: `${h}%` }}
                    title={`${w.date}: ${w.weightKg}kg`}
                  />
                );
              })}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...weights].reverse().slice(0, 8).map((w) => (
                <div
                  key={w.id}
                  className="flex justify-between text-sm border-b border-border-subtle pb-1.5"
                >
                  <span className="font-num text-xs text-muted">{w.date}</span>
                  <span className="font-num text-secondary">
                    {formatNumber(w.weightKg, 1)} kg
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Strength */}
      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle>Strength trends</CardTitle>
            <CardDescription>
              From logged workouts · progressive overload
            </CardDescription>
          </div>
        </CardHeader>
        {strengthSeries.length === 0 ? (
          <p className="text-sm text-tertiary">
            Log sets with weight (e.g. &quot;bench 3x8 @ 80kg&quot;) to see
            trends.
          </p>
        ) : (
          <div className="space-y-5">
            {strengthSeries.map((series) => {
              const first = series.points[0];
              const last = series.points[series.points.length - 1];
              const delta = last.load - first.load;
              const maxW = Math.max(...series.points.map((p) => p.load));
              return (
                <div key={series.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-primary font-medium">
                      {series.name}
                    </span>
                    <Badge variant={delta >= 0 ? "cyan" : "warning"}>
                      {last.load} kg × {last.reps}
                      {series.points.length > 1 && (
                        <span className="opacity-80">
                          {" "}
                          · {delta >= 0 ? "+" : ""}
                          {delta.toFixed(1)}kg
                        </span>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {series.points.map((p, i) => (
                      <div
                        key={`${p.date}-${i}`}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full rounded-t bg-cyan/40 min-h-[4px]"
                          style={{
                            height: `${maxW ? (p.load / maxW) * 100 : 50}%`,
                          }}
                          title={`${p.date}: ${p.load}kg × ${p.reps}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted font-num">
                      {first.date}
                    </span>
                    <span className="text-[10px] text-muted font-num">
                      {last.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Preferences */}
      {journal.preferences.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <div>
              <CardTitle>Exercise preferences</CardTitle>
              <CardDescription>
                Liked / disliked — feeds future session generation
              </CardDescription>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-1.5">
            {journal.preferences.map((p) => (
              <Badge
                key={p.exerciseName}
                variant={
                  p.feeling === "liked"
                    ? "cyan"
                    : p.feeling === "disliked"
                      ? "warning"
                      : "steel"
                }
              >
                {p.exerciseName} · {p.feeling}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Physique history */}
      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle>Physique updates</CardTitle>
            <CardDescription>
              Hologram recalibrations over time
            </CardDescription>
          </div>
          <Link href="/update">
            <Button size="sm" variant="outline">
              New
            </Button>
          </Link>
        </CardHeader>
        {journal.physiqueUpdates.length === 0 ? (
          <p className="text-sm text-tertiary">
            Upload a new physique capture to re-rate body parts and adjust
            training.
          </p>
        ) : (
          <div className="space-y-3">
            {journal.physiqueUpdates.map((u) => (
              <div
                key={u.id}
                className="rounded-[var(--radius-md)] border border-border-subtle p-3"
              >
                <div className="flex justify-between gap-2 mb-1">
                  <p className="text-sm text-primary">{u.summary}</p>
                  <span className="font-num text-[11px] text-muted shrink-0">
                    {u.date}
                  </span>
                </div>
                {u.whatsWorking[0] && (
                  <p className="text-xs text-cyan mt-1">
                    Working: {u.whatsWorking[0]}
                  </p>
                )}
                {u.needsChange[0] && (
                  <p className="text-xs text-tertiary mt-0.5">
                    Focus: {u.needsChange[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Session count */}
      <Card>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-num text-2xl text-primary">
              {journal.workouts.length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted mt-1">
              Sessions
            </p>
          </div>
          <div>
            <p className="font-num text-2xl text-primary">
              {journal.meals.length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted mt-1">
              Meals
            </p>
          </div>
          <div>
            <p className="font-num text-2xl text-primary">
              {lastPhysique ? journal.physiqueUpdates.length : 0}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted mt-1">
              Captures
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

function RadarChart({
  data,
}: {
  data: { id: string; label: string; score: number }[];
}) {
  const n = data.length;
  const cx = 120;
  const cy = 120;
  const maxR = 90;

  const point = (i: number, score: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (score / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const poly = data
    .map((d, i) => {
      const p = point(i, d.score);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] h-auto">
      {rings.map((r) => (
        <polygon
          key={r}
          points={data
            .map((_, i) => {
              const p = point(i, r);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(139,146,156,0.15)"
          strokeWidth="1"
        />
      ))}
      {data.map((_, i) => {
        const p = point(i, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(139,146,156,0.12)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={poly}
        fill="rgba(94,200,192,0.15)"
        stroke="rgba(94,200,192,0.7)"
        strokeWidth="1.5"
      />
      {data.map((d, i) => {
        const p = point(i, d.score);
        const labelR = maxR + 16;
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <g key={d.id}>
            <circle cx={p.x} cy={p.y} r="3" fill="rgba(94,200,192,0.9)" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(154,160,168,0.9)"
              fontSize="8"
              fontFamily="var(--font-sans)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
