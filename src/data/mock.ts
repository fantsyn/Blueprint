import type {
  BodyPartScore,
  DayAgenda,
  MeasurementEntry,
  StrengthEntry,
  UserProfile,
} from "@/types";
import { BODY_PART_LABELS, scoreToPriority, scoreToStatus } from "@/lib/body-parts";
import { buildNutritionTargets } from "@/lib/nutrition";
import { generateSession } from "@/lib/workout-engine";

function makeScore(
  id: BodyPartScore["id"],
  score: number,
  reason?: string
): BodyPartScore {
  return {
    id,
    label: BODY_PART_LABELS[id],
    score,
    status: scoreToStatus(score),
    priority: scoreToPriority(score),
    reason,
  };
}

export const MOCK_SCORES: BodyPartScore[] = [
  makeScore("traps", 58),
  makeScore(
    "shoulders",
    42,
    "Lateral delts lag relative to chest and traps — common push-dominant pattern"
  ),
  makeScore("chest", 68),
  makeScore(
    "lats",
    38,
    "Width underdeveloped vs torso thickness; V-taper priority"
  ),
  makeScore("mid_back", 48, "Thickness trailing lats slightly less but still soft"),
  makeScore("biceps", 55),
  makeScore("triceps", 52),
  makeScore("forearms", 60),
  makeScore("abs", 50),
  makeScore("obliques", 54),
  makeScore(
    "glutes",
    44,
    "Posterior chain undertrained relative to quads from running history"
  ),
  makeScore("quads", 72),
  makeScore(
    "hamstrings",
    40,
    "Hamstring:quad ratio skewed — injury risk + aesthetics"
  ),
  makeScore("calves", 62),
];

export const MOCK_PROFILE: UserProfile = {
  id: "demo-user",
  name: "Alex",
  metrics: {
    age: 28,
    sex: "male",
    heightCm: 178,
    weightKg: 79,
    bodyFatPct: 16,
    experience: "intermediate",
    equipment: "full_gym",
    injuries: ["left shoulder mild impingement — avoid heavy behind-neck work"],
  },
  goal: {
    type: "recomposition",
    description: "Build a more athletic V-taper while dropping residual fat",
    targetWeightKg: 77,
    inspoImages: [],
  },
  photos: [],
  bodyPartScores: MOCK_SCORES,
  onboardingComplete: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function buildTodayAgenda(profile: UserProfile = MOCK_PROFILE): DayAgenda {
  const today = new Date().toISOString().slice(0, 10);
  const nutrition = buildNutritionTargets(profile.metrics, "maintain");
  const session = generateSession({
    metrics: profile.metrics,
    scores: profile.bodyPartScores,
    goal: profile.goal.type,
    date: today,
    availableMinutes: 55,
  });

  const top = [...profile.bodyPartScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  return {
    date: today,
    session,
    isRestDay: false,
    nutrition,
    recovery: {
      score: 72,
      label: "moderate",
      note: "Sleep and readiness look solid. Keep intensity high on primary lifts.",
    },
    priorityParts: session.focusParts,
    priorityReason: session.focusReason,
  };
}

export const MOCK_MEASUREMENTS: MeasurementEntry[] = [
  {
    date: "2026-04-01",
    weightKg: 81.2,
    waistCm: 84,
    chestCm: 98,
    armsCm: 36,
    thighsCm: 58,
  },
  {
    date: "2026-05-01",
    weightKg: 80.1,
    waistCm: 82,
    chestCm: 99,
    armsCm: 36.5,
    thighsCm: 58.5,
  },
  {
    date: "2026-06-01",
    weightKg: 79.4,
    waistCm: 81,
    chestCm: 100,
    armsCm: 37,
    thighsCm: 59,
  },
  {
    date: "2026-07-01",
    weightKg: 79.0,
    waistCm: 80,
    chestCm: 101,
    armsCm: 37.2,
    thighsCm: 59.5,
  },
];

export const MOCK_STRENGTH: StrengthEntry[] = [
  {
    exerciseId: "bb-bench",
    exerciseName: "Barbell Bench Press",
    date: "2026-04-15",
    weightKg: 80,
    reps: 5,
  },
  {
    exerciseId: "bb-bench",
    exerciseName: "Barbell Bench Press",
    date: "2026-05-20",
    weightKg: 85,
    reps: 5,
  },
  {
    exerciseId: "bb-bench",
    exerciseName: "Barbell Bench Press",
    date: "2026-07-01",
    weightKg: 90,
    reps: 5,
  },
  {
    exerciseId: "squat",
    exerciseName: "Back Squat",
    date: "2026-04-15",
    weightKg: 100,
    reps: 5,
  },
  {
    exerciseId: "squat",
    exerciseName: "Back Squat",
    date: "2026-06-01",
    weightKg: 110,
    reps: 5,
  },
  {
    exerciseId: "squat",
    exerciseName: "Back Squat",
    date: "2026-07-10",
    weightKg: 115,
    reps: 5,
  },
  {
    exerciseId: "pullup",
    exerciseName: "Pull-Ups",
    date: "2026-04-15",
    weightKg: 0,
    reps: 6,
  },
  {
    exerciseId: "pullup",
    exerciseName: "Pull-Ups",
    date: "2026-07-10",
    weightKg: 10,
    reps: 5,
  },
];
