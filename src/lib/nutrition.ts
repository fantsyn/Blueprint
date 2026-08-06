import type {
  MacroTargets,
  NutritionPhase,
  NutritionTargets,
  Sex,
  UserMetrics,
} from "@/types";

/**
 * Mifflin-St Jeor BMR + activity multiplier.
 * Bulk +250–400, cut –300–500 depending on experience/BF.
 */
export function calcBmr(metrics: UserMetrics): number {
  const { weightKg, heightCm, age, sex } = metrics;
  // BMR = 10*w + 6.25*h - 5*a + s
  const s = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + s;
}

function activityMultiplier(experience: UserMetrics["experience"]): number {
  switch (experience) {
    case "beginner":
      return 1.45;
    case "intermediate":
      return 1.55;
    case "advanced":
      return 1.65;
  }
}

export function calcTdee(metrics: UserMetrics): number {
  return Math.round(calcBmr(metrics) * activityMultiplier(metrics.experience));
}

function bulkSurplus(metrics: UserMetrics): number {
  if (metrics.experience === "beginner") return 350;
  if (metrics.experience === "advanced") return 250;
  return 300;
}

function cutDeficit(metrics: UserMetrics): number {
  const bf = metrics.bodyFatPct ?? (metrics.sex === "male" ? 18 : 28);
  if (bf > 25) return 500;
  if (bf < 12) return 300;
  return 400;
}

export function calcMacros(
  calories: number,
  weightKg: number,
  phase: NutritionPhase,
  sex: Sex
): MacroTargets {
  // Protein: higher on cut, solid on bulk
  const proteinPerKg =
    phase === "cut" ? 2.2 : phase === "bulk" ? 1.8 : 2.0;
  const proteinG = Math.round(weightKg * proteinPerKg);

  // Fat: ~25–30% of calories
  const fatPct = phase === "cut" ? 0.28 : 0.25;
  const fatG = Math.round((calories * fatPct) / 9);

  const remaining = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remaining / 4));

  // slight female carb adjustment not needed — kcal-driven
  void sex;

  return { calories, proteinG, carbsG, fatG };
}

export function buildNutritionTargets(
  metrics: UserMetrics,
  preferredPhase?: NutritionPhase
): NutritionTargets {
  const maintainCal = calcTdee(metrics);
  const bulkCal = maintainCal + bulkSurplus(metrics);
  const cutCal = maintainCal - cutDeficit(metrics);

  const maintain = calcMacros(
    maintainCal,
    metrics.weightKg,
    "maintain",
    metrics.sex
  );
  const bulk = calcMacros(bulkCal, metrics.weightKg, "bulk", metrics.sex);
  const cut = calcMacros(cutCal, metrics.weightKg, "cut", metrics.sex);

  const phase =
    preferredPhase ??
    (metrics.bodyFatPct && metrics.bodyFatPct > 22
      ? "cut"
      : metrics.experience === "beginner"
        ? "bulk"
        : "maintain");

  const active =
    phase === "bulk" ? bulk : phase === "cut" ? cut : maintain;

  return { phase, maintain, bulk, cut, active };
}
