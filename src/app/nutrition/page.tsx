"use client";

import { useAppStore } from "@/store/useAppStore";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import { calcBmr, calcTdee } from "@/lib/nutrition";
import type { NutritionPhase } from "@/types";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const PHASES: { value: NutritionPhase; label: string }[] = [
  { value: "cut", label: "Cut" },
  { value: "maintain", label: "Maintain" },
  { value: "bulk", label: "Build" },
];

export default function NutritionPage() {
  const { ready, profile, agenda } = useHydratedProfile();
  const nutritionPhase = useAppStore((s) => s.nutritionPhase);
  const setNutritionPhase = useAppStore((s) => s.setNutritionPhase);

  if (!ready || !profile || !agenda) {
    return <LoadingScreen />;
  }

  const { nutrition } = agenda;
  const active = nutrition.active;
  const bmr = Math.round(calcBmr(profile.metrics));
  const tdee = calcTdee(profile.metrics);

  const macros = [
    {
      label: "Protein",
      value: active.proteinG,
      unit: "g",
      kcal: active.proteinG * 4,
      pct: Math.round(((active.proteinG * 4) / active.calories) * 100),
      hint: "Anchored to bodyweight · higher on cut",
    },
    {
      label: "Carbohydrates",
      value: active.carbsG,
      unit: "g",
      kcal: active.carbsG * 4,
      pct: Math.round(((active.carbsG * 4) / active.calories) * 100),
      hint: "Fills remaining calories after P/F",
    },
    {
      label: "Fat",
      value: active.fatG,
      unit: "g",
      kcal: active.fatG * 9,
      pct: Math.round(((active.fatG * 9) / active.calories) * 100),
      hint: "~25–28% of total energy",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Fuel"
        title="Nutrition"
        description="Calorie phases and macro targets adapted to your metrics."
        action={
          <SegmentedControl
            size="sm"
            value={nutritionPhase}
            onChange={setNutritionPhase}
            options={PHASES}
          />
        }
      />

      {/* Hero calories */}
      <Card elevated className="mb-6 text-center !py-9">
        <p className="eyebrow mb-3">
          Daily target · {nutritionPhase}
        </p>
        <p className="font-num text-5xl sm:text-[3.5rem] tracking-tight text-primary leading-none">
          {formatNumber(active.calories)}
        </p>
        <p className="mt-2 text-[13px] text-tertiary">kilocalories</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Badge variant="steel">BMR {formatNumber(bmr)}</Badge>
          <Badge variant="steel">TDEE {formatNumber(tdee)}</Badge>
          {nutritionPhase === "bulk" && (
            <Badge variant="cyan">
              +{active.calories - nutrition.maintain.calories} surplus
            </Badge>
          )}
          {nutritionPhase === "cut" && (
            <Badge variant="cyan">
              −{nutrition.maintain.calories - active.calories} deficit
            </Badge>
          )}
        </div>
      </Card>

      {/* Macros */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {macros.map((m) => (
          <Card key={m.label}>
            <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
              {m.label}
            </p>
            <p className="font-num text-3xl text-primary tracking-tight">
              {m.value}
              <span className="text-base text-muted ml-0.5">{m.unit}</span>
            </p>
            <p className="mt-1 font-num text-xs text-tertiary">
              {m.kcal} kcal · {m.pct}%
            </p>
            <p className="mt-3 text-[11px] text-muted leading-snug">{m.hint}</p>
          </Card>
        ))}
      </div>

      {/* All phases comparison */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Phase comparison</CardTitle>
            <CardDescription>
              Maintain · build (+250–400) · cut (−300–500)
            </CardDescription>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted border-b border-border-subtle">
                <th className="text-left font-medium py-2 pr-4">Phase</th>
                <th className="text-right font-medium py-2 px-2 font-num">
                  kcal
                </th>
                <th className="text-right font-medium py-2 px-2 font-num">P</th>
                <th className="text-right font-medium py-2 px-2 font-num">C</th>
                <th className="text-right font-medium py-2 pl-2 font-num">F</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["cut", nutrition.cut],
                  ["maintain", nutrition.maintain],
                  ["bulk", nutrition.bulk],
                ] as const
              ).map(([phase, t]) => (
                <tr
                  key={phase}
                  className={cn(
                    "border-b border-border-subtle last:border-0",
                    phase === nutritionPhase && "bg-cyan-soft/50"
                  )}
                >
                  <td className="py-3 pr-4 capitalize text-secondary">
                    {phase === "bulk" ? "Build" : phase}
                    {phase === nutritionPhase && (
                      <span className="ml-2 text-[10px] text-cyan uppercase">
                        active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right font-num text-primary">
                    {formatNumber(t.calories)}
                  </td>
                  <td className="py-3 px-2 text-right font-num text-secondary">
                    {t.proteinG}g
                  </td>
                  <td className="py-3 px-2 text-right font-num text-secondary">
                    {t.carbsG}g
                  </td>
                  <td className="py-3 pl-2 text-right font-num text-secondary">
                    {t.fatG}g
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-6 text-center text-[11px] text-muted">
        Logging arrives later · Targets recalculate when metrics change
      </p>
    </AppShell>
  );
}
