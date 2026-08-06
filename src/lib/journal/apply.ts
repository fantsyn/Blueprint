import type {
  AppliedLogAction,
  CoachExtraction,
  MealLog,
  UserJournal,
  WorkoutLog,
} from "@/types/journal";
import type { GoalType, NutritionPhase, UserProfile } from "@/types";
import { buildNutritionTargets } from "@/lib/nutrition";

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Estimate macros from rough meal description when AI omits numbers */
export function estimateMealMacros(
  name: string,
  description?: string,
  partial?: {
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }
) {
  if (
    partial?.calories != null &&
    partial.proteinG != null &&
    partial.carbsG != null &&
    partial.fatG != null
  ) {
    return {
      calories: Math.round(partial.calories),
      proteinG: Math.round(partial.proteinG),
      carbsG: Math.round(partial.carbsG),
      fatG: Math.round(partial.fatG),
    };
  }

  const text = `${name} ${description || ""}`.toLowerCase();
  let calories = partial?.calories ?? 450;
  let proteinG = partial?.proteinG ?? 30;
  let carbsG = partial?.carbsG ?? 40;
  let fatG = partial?.fatG ?? 15;

  if (/chicken|turkey|fish|salmon|tuna|egg|protein/.test(text)) proteinG += 15;
  if (/rice|pasta|bread|oat|potato|bagel/.test(text)) carbsG += 25;
  if (/avocado|oil|butter|cheese|nuts|peanut/.test(text)) fatG += 12;
  if (/salad|veg|broccoli|spinach/.test(text)) {
    calories -= 80;
    carbsG -= 10;
  }
  if (/burger|pizza|fried|fries|shake|dessert|cake/.test(text)) {
    calories += 250;
    fatG += 15;
    carbsG += 20;
  }
  if (/shake|smoothie|whey/.test(text)) {
    proteinG += 20;
    calories = partial?.calories ?? 280;
  }

  // Reconcile if only some provided
  if (partial?.calories != null) calories = partial.calories;
  if (partial?.proteinG != null) proteinG = partial.proteinG;
  if (partial?.carbsG != null) carbsG = partial.carbsG;
  if (partial?.fatG != null) fatG = partial.fatG;

  // If macros incomplete, derive calories from P/C/F
  if (partial?.calories == null) {
    calories = proteinG * 4 + carbsG * 4 + fatG * 9;
  }

  return {
    calories: Math.max(50, Math.round(calories)),
    proteinG: Math.max(0, Math.round(proteinG)),
    carbsG: Math.max(0, Math.round(carbsG)),
    fatG: Math.max(0, Math.round(fatG)),
  };
}

export interface ApplyResult {
  journal: UserJournal;
  profile?: UserProfile;
  nutritionPhase?: NutritionPhase;
  applied: AppliedLogAction[];
}

export function applyCoachExtraction(
  journal: UserJournal,
  extraction: CoachExtraction,
  profile: UserProfile | null,
  nutritionPhase: NutritionPhase
): ApplyResult {
  let next: UserJournal = {
    ...journal,
    workouts: [...journal.workouts],
    meals: [...journal.meals],
    weights: [...journal.weights],
    steps: [...journal.steps],
    goalChanges: [...journal.goalChanges],
    preferences: [...journal.preferences],
    physiqueUpdates: [...journal.physiqueUpdates],
    chat: [...journal.chat],
  };
  let nextProfile = profile ? { ...profile } : null;
  let nextPhase = nutritionPhase;
  const applied: AppliedLogAction[] = [];

  for (const action of extraction.actions || []) {
    if (!action || action.type === "none") continue;

    if (action.type === "workout") {
      const log: WorkoutLog = {
        id: id(),
        date: action.date || today(),
        title: action.title || "Logged session",
        exercises: (action.exercises || []).map((ex) => ({
          name: ex.name,
          bodyParts: ex.bodyParts,
          sets: (ex.sets || []).map((s) => ({
            reps: Number(s.reps) || 0,
            weightKg: s.weightKg != null ? Number(s.weightKg) : undefined,
            rpe: s.rpe != null ? Number(s.rpe) : undefined,
          })),
          notes: ex.notes,
        })),
        durationMin: action.durationMin,
        intensity: action.intensity,
        steps: action.steps,
        feeling: action.feeling,
        notes: action.notes,
        source: "chat",
        createdAt: new Date().toISOString(),
      };
      next.workouts.unshift(log);
      // Preference signals from workout feeling
      if (action.feeling && action.feeling !== "neutral") {
        for (const ex of log.exercises) {
          upsertPreference(next, ex.name, action.feeling);
        }
      }
      const setCount = log.exercises.reduce((n, e) => n + e.sets.length, 0);
      applied.push({
        type: "workout",
        summary: `${log.title}: ${log.exercises.length} exercises · ${setCount} sets`,
        refId: log.id,
      });
    }

    if (action.type === "meal") {
      const macros = estimateMealMacros(action.name, action.description, {
        calories: action.calories,
        proteinG: action.proteinG,
        carbsG: action.carbsG,
        fatG: action.fatG,
      });
      const meal: MealLog = {
        id: id(),
        date: action.date || today(),
        name: action.name,
        description: action.description,
        macros,
        source: "chat",
        createdAt: new Date().toISOString(),
      };
      next.meals.unshift(meal);
      applied.push({
        type: "meal",
        summary: `${meal.name}: ${macros.calories} kcal · P${macros.proteinG} C${macros.carbsG} F${macros.fatG}`,
        refId: meal.id,
      });
    }

    if (action.type === "weight") {
      const w = {
        id: id(),
        date: action.date || today(),
        weightKg: Number(action.weightKg),
        note: action.note,
        source: "chat" as const,
        createdAt: new Date().toISOString(),
      };
      next.weights.unshift(w);
      if (nextProfile) {
        nextProfile = {
          ...nextProfile,
          metrics: { ...nextProfile.metrics, weightKg: w.weightKg },
          updatedAt: new Date().toISOString(),
        };
      }
      applied.push({
        type: "weight",
        summary: `Weight ${w.weightKg} kg`,
        refId: w.id,
      });
    }

    if (action.type === "steps") {
      const s = {
        id: id(),
        date: action.date || today(),
        steps: Math.round(Number(action.steps)),
        source: "chat" as const,
        createdAt: new Date().toISOString(),
      };
      next.steps.unshift(s);
      applied.push({
        type: "steps",
        summary: `${s.steps.toLocaleString()} steps`,
        refId: s.id,
      });
    }

    if (action.type === "goal" && nextProfile) {
      const prev = nextProfile.goal.type;
      const newGoal = action.newGoal as GoalType;
      next.goalChanges.unshift({
        id: id(),
        date: today(),
        previousGoal: prev,
        newGoal,
        phase: action.phase,
        note: action.note,
        source: "chat",
        createdAt: new Date().toISOString(),
      });
      nextProfile = {
        ...nextProfile,
        goal: { ...nextProfile.goal, type: newGoal },
        updatedAt: new Date().toISOString(),
      };
      if (action.phase) {
        nextPhase = action.phase;
      }
      // Recalc nutrition if phase/goal weight-related
      if (nextProfile) {
        const targets = buildNutritionTargets(nextProfile.metrics, nextPhase);
        void targets;
      }
      applied.push({
        type: "goal",
        summary: `Goal → ${newGoal.replace(/_/g, " ")}${action.phase ? ` · ${action.phase}` : ""}`,
      });
    }

    if (action.type === "preference") {
      upsertPreference(next, action.exerciseName, action.feeling, action.note);
      applied.push({
        type: "preference",
        summary: `${action.exerciseName}: ${action.feeling}`,
      });
    }
  }

  return {
    journal: next,
    profile: nextProfile || undefined,
    nutritionPhase: nextPhase,
    applied,
  };
}

function upsertPreference(
  journal: UserJournal,
  exerciseName: string,
  feeling: "liked" | "disliked" | "neutral",
  note?: string
) {
  const key = exerciseName.trim().toLowerCase();
  const idx = journal.preferences.findIndex(
    (p) => p.exerciseName.toLowerCase() === key
  );
  const entry = {
    exerciseName: exerciseName.trim(),
    feeling,
    updatedAt: new Date().toISOString(),
    note,
  };
  if (idx >= 0) journal.preferences[idx] = entry;
  else journal.preferences.unshift(entry);
}

export function applyManualWorkout(
  journal: UserJournal,
  log: Omit<WorkoutLog, "id" | "createdAt" | "source">
): UserJournal {
  const entry: WorkoutLog = {
    ...log,
    id: id(),
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  return { ...journal, workouts: [entry, ...journal.workouts] };
}

export function applyManualMeal(
  journal: UserJournal,
  log: Omit<MealLog, "id" | "createdAt" | "source" | "macros"> & {
    macros?: MealLog["macros"];
    description?: string;
  }
): UserJournal {
  const macros =
    log.macros || estimateMealMacros(log.name, log.description);
  const entry: MealLog = {
    id: id(),
    date: log.date,
    name: log.name,
    description: log.description,
    macros,
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  return { ...journal, meals: [entry, ...journal.meals] };
}
