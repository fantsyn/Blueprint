import type { UserJournal } from "@/types/journal";
import type { BodyPartScore, UserProfile } from "@/types";
import { BODY_PART_LABELS } from "@/lib/body-parts";

export interface ProgressInsight {
  id: string;
  tone: "positive" | "neutral" | "attention";
  title: string;
  detail: string;
}

export function buildInsights(
  journal: UserJournal,
  profile: UserProfile | null
): ProgressInsight[] {
  const insights: ProgressInsight[] = [];
  const workouts = [...journal.workouts].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const weights = [...journal.weights].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Training consistency (last 14 days)
  const now = new Date();
  const days14 = new Set<string>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days14.add(d.toISOString().slice(0, 10));
  }
  const trainedDays = new Set(
    workouts.filter((w) => days14.has(w.date)).map((w) => w.date)
  );
  if (workouts.length > 0) {
    insights.push({
      id: "consistency",
      tone: trainedDays.size >= 6 ? "positive" : trainedDays.size >= 3 ? "neutral" : "attention",
      title: `${trainedDays.size} training days · last 14`,
      detail:
        trainedDays.size >= 6
          ? "Strong consistency — keep progressive overload on lagging regions."
          : trainedDays.size >= 3
            ? "Solid base. One more weekly session would accelerate lagging parts."
            : "Low recent frequency. Aim for 3+ sessions this week.",
    });
  } else {
    insights.push({
      id: "consistency-empty",
      tone: "neutral",
      title: "No workouts logged yet",
      detail: "Log via Coach chat or Workouts → Add to start historical tracking.",
    });
  }

  // Weight trend
  if (weights.length >= 2) {
    const first = weights[0];
    const last = weights[weights.length - 1];
    const delta = last.weightKg - first.weightKg;
    const goal = profile?.goal.type;
    let tone: ProgressInsight["tone"] = "neutral";
    if (goal === "lose_fat" && delta < -0.5) tone = "positive";
    if (goal === "build_muscle" && delta > 0.5) tone = "positive";
    if (goal === "lose_fat" && delta > 1) tone = "attention";
    if (goal === "build_muscle" && delta < -1) tone = "attention";
    insights.push({
      id: "weight",
      tone,
      title: `Weight ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg`,
      detail: `${first.weightKg} → ${last.weightKg} kg across ${weights.length} check-ins.`,
    });
  }

  // Strength proxies — same exercise name max load over time
  const byEx = new Map<string, { date: string; load: number; reps: number }[]>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const key = ex.name.toLowerCase();
      if (!byEx.has(key)) byEx.set(key, []);
      for (const s of ex.sets) {
        if (s.weightKg != null && s.weightKg > 0) {
          byEx.get(key)!.push({
            date: w.date,
            load: s.weightKg,
            reps: s.reps,
          });
        }
      }
    }
  }
  let bestGain: { name: string; from: number; to: number } | null = null;
  for (const [name, points] of byEx) {
    if (points.length < 2) continue;
    points.sort((a, b) => a.date.localeCompare(b.date));
    const from = points[0].load;
    const to = points[points.length - 1].load;
    if (to > from && (!bestGain || to - from > bestGain.to - bestGain.from)) {
      bestGain = { name, from, to };
    }
  }
  if (bestGain) {
    insights.push({
      id: "strength",
      tone: "positive",
      title: `${titleCase(bestGain.name)} +${(bestGain.to - bestGain.from).toFixed(1)} kg`,
      detail: `Load progressed from ${bestGain.from} → ${bestGain.to} kg.`,
    });
  }

  // Preferences
  const liked = journal.preferences.filter((p) => p.feeling === "liked");
  const disliked = journal.preferences.filter((p) => p.feeling === "disliked");
  if (disliked.length) {
    insights.push({
      id: "disliked",
      tone: "attention",
      title: `${disliked.length} exercises marked disliked`,
      detail: `Consider swaps for: ${disliked
        .slice(0, 3)
        .map((d) => d.exerciseName)
        .join(", ")}.`,
    });
  }
  if (liked.length) {
    insights.push({
      id: "liked",
      tone: "positive",
      title: "Enjoyment signals logged",
      detail: `Keep favourites in rotation: ${liked
        .slice(0, 3)
        .map((d) => d.exerciseName)
        .join(", ")}.`,
    });
  }

  // Body-part hologram delta from last physique update
  const phys = journal.physiqueUpdates;
  if (phys.length >= 1) {
    const latest = phys[0];
    if (latest.previousScores?.length) {
      const deltas = latest.scores
        .map((s) => {
          const prev = latest.previousScores!.find((p) => p.id === s.id);
          return prev ? { id: s.id, d: s.score - prev.score } : null;
        })
        .filter(Boolean) as { id: string; d: number }[];
      const gains = deltas.filter((d) => d.d > 0).sort((a, b) => b.d - a.d);
      const losses = deltas.filter((d) => d.d < 0).sort((a, b) => a.d - b.d);
      if (gains[0]) {
        insights.push({
          id: "phys-gain",
          tone: "positive",
          title: `${BODY_PART_LABELS[gains[0].id as keyof typeof BODY_PART_LABELS] || gains[0].id} +${gains[0].d}`,
          detail: "Relative development improved vs prior capture.",
        });
      }
      if (losses[0]) {
        insights.push({
          id: "phys-lag",
          tone: "attention",
          title: `${BODY_PART_LABELS[losses[0].id as keyof typeof BODY_PART_LABELS] || losses[0].id} ${losses[0].d}`,
          detail: "May need more volume or recovery focus.",
        });
      }
    } else {
      insights.push({
        id: "phys-latest",
        tone: "neutral",
        title: "Physique update on file",
        detail: latest.summary.slice(0, 140),
      });
    }
  }

  // Nutrition adherence (meals today vs target)
  const today = new Date().toISOString().slice(0, 10);
  const mealsToday = journal.meals.filter((m) => m.date === today);
  if (mealsToday.length) {
    const cals = mealsToday.reduce((n, m) => n + m.macros.calories, 0);
    insights.push({
      id: "meals-today",
      tone: "neutral",
      title: `Today · ${cals} kcal logged`,
      detail: `${mealsToday.length} meal${mealsToday.length > 1 ? "s" : ""} recorded.`,
    });
  }

  // Lagging parts from profile
  if (profile) {
    const lagging = [...profile.bodyPartScores]
      .filter((s) => s.status === "lagging")
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
    if (lagging.length) {
      insights.push({
        id: "lagging",
        tone: "attention",
        title: `Focus: ${lagging.map((s) => s.label).join(" · ")}`,
        detail: "Prioritise these on the hologram this week.",
      });
    }
  }

  return insights.slice(0, 8);
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreDeltaMap(
  current: BodyPartScore[],
  previous?: BodyPartScore[]
): Map<string, number> {
  const map = new Map<string, number>();
  if (!previous) return map;
  for (const s of current) {
    const p = previous.find((x) => x.id === s.id);
    if (p) map.set(s.id, s.score - p.score);
  }
  return map;
}

export function mealsForDate(journal: UserJournal, date: string) {
  return journal.meals.filter((m) => m.date === date);
}

export function workoutsForDate(journal: UserJournal, date: string) {
  return journal.workouts.filter((w) => w.date === date);
}

export function dailyMealTotals(journal: UserJournal, date: string) {
  const meals = mealsForDate(journal, date);
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.macros.calories,
      proteinG: acc.proteinG + m.macros.proteinG,
      carbsG: acc.carbsG + m.macros.carbsG,
      fatG: acc.fatG + m.macros.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}
