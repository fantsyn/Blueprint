import type {
  BodyPartId,
  BodyPartScore,
  EquipmentAccess,
  Exercise,
  ExperienceLevel,
  GoalType,
  UserMetrics,
  WorkoutSession,
} from "@/types";
import { BODY_PART_LABELS } from "./body-parts";

interface ExerciseTemplate {
  id: string;
  name: string;
  bodyParts: BodyPartId[];
  equipment: EquipmentAccess[];
  cues: string[];
  progressiveOverload: string;
  baseSets: number;
  reps: string;
  restSec: number;
}

const EXERCISE_DB: ExerciseTemplate[] = [
  {
    id: "bb-bench",
    name: "Barbell Bench Press",
    bodyParts: ["chest", "triceps", "shoulders"],
    equipment: ["full_gym"],
    cues: ["Retract scapulae", "Feet planted", "Bar path mid-chest to lockout"],
    progressiveOverload: "Add 2.5kg when all sets hit top of rep range",
    baseSets: 4,
    reps: "5–8",
    restSec: 180,
  },
  {
    id: "db-press",
    name: "Dumbbell Bench Press",
    bodyParts: ["chest", "triceps", "shoulders"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Soft arch", "Wrists stacked", "Full stretch at bottom"],
    progressiveOverload: "Increase weight or add a rep each week",
    baseSets: 3,
    reps: "8–12",
    restSec: 120,
  },
  {
    id: "pushups",
    name: "Push-Ups",
    bodyParts: ["chest", "triceps", "shoulders"],
    equipment: ["bodyweight", "minimal", "home_dumbbells", "full_gym"],
    cues: ["Body in straight line", "Elbows ~45°", "Full ROM"],
    progressiveOverload: "Elevate feet or add tempo (3s eccentric)",
    baseSets: 3,
    reps: "AMRAP",
    restSec: 90,
  },
  {
    id: "ohp",
    name: "Overhead Press",
    bodyParts: ["shoulders", "triceps", "traps"],
    equipment: ["full_gym"],
    cues: ["Brace core", "Bar over mid-foot", "Full lockout overhead"],
    progressiveOverload: "Microload +1.25–2.5kg when 5×5 is clean",
    baseSets: 4,
    reps: "5–8",
    restSec: 150,
  },
  {
    id: "lateral-raise",
    name: "Lateral Raises",
    bodyParts: ["shoulders"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Slight elbow bend", "Lead with elbows", "Control the descent"],
    progressiveOverload: "Prioritize form; add weight only when 12 reps are easy",
    baseSets: 3,
    reps: "12–15",
    restSec: 60,
  },
  {
    id: "pullup",
    name: "Pull-Ups",
    bodyParts: ["lats", "biceps", "mid_back"],
    equipment: ["full_gym", "minimal"],
    cues: ["Full hang start", "Chest to bar", "Avoid kipping"],
    progressiveOverload: "Add weight or slow eccentrics when 8+ clean",
    baseSets: 4,
    reps: "5–10",
    restSec: 150,
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    bodyParts: ["lats", "biceps"],
    equipment: ["full_gym"],
    cues: ["Pull elbows to hips", "Slight lean back", "Squeeze at bottom"],
    progressiveOverload: "Increase stack when top reps are solid",
    baseSets: 3,
    reps: "8–12",
    restSec: 90,
  },
  {
    id: "db-row",
    name: "Single-Arm Dumbbell Row",
    bodyParts: ["lats", "mid_back", "biceps"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Neutral spine", "Elbow past torso", "No torso rotation"],
    progressiveOverload: "Match both sides; add weight weekly",
    baseSets: 3,
    reps: "8–12",
    restSec: 90,
  },
  {
    id: "face-pull",
    name: "Face Pulls",
    bodyParts: ["shoulders", "mid_back", "traps"],
    equipment: ["full_gym"],
    cues: ["External rotation at finish", "Elbows high", "Light–moderate load"],
    progressiveOverload: "Volume first; keep form pristine",
    baseSets: 3,
    reps: "12–15",
    restSec: 60,
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    bodyParts: ["mid_back", "lats", "biceps"],
    equipment: ["full_gym"],
    cues: ["Hinge ~45°", "Pull to lower ribs", "Control eccentric"],
    progressiveOverload: "Add 2.5kg when all sets complete",
    baseSets: 4,
    reps: "6–10",
    restSec: 120,
  },
  {
    id: "squat",
    name: "Back Squat",
    bodyParts: ["quads", "glutes", "hamstrings"],
    equipment: ["full_gym"],
    cues: ["Brace hard", "Knees track toes", "Depth to parallel+"],
    progressiveOverload: "Linear progression +2.5–5kg when form holds",
    baseSets: 4,
    reps: "5–8",
    restSec: 180,
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    bodyParts: ["quads", "glutes"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Chest up", "Elbows inside knees", "Full depth"],
    progressiveOverload: "Heavier DB or pause reps",
    baseSets: 3,
    reps: "10–15",
    restSec: 90,
  },
  {
    id: "rdl",
    name: "Romanian Deadlift",
    bodyParts: ["hamstrings", "glutes", "mid_back"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Soft knees", "Push hips back", "Feel hamstring stretch"],
    progressiveOverload: "Slow eccentric; load when ROM is consistent",
    baseSets: 3,
    reps: "8–12",
    restSec: 120,
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    bodyParts: ["glutes", "hamstrings"],
    equipment: ["full_gym"],
    cues: ["Chin tucked", "Full hip extension", "Pause at top"],
    progressiveOverload: "Add plate load weekly",
    baseSets: 3,
    reps: "8–12",
    restSec: 90,
  },
  {
    id: "lunges",
    name: "Walking Lunges",
    bodyParts: ["quads", "glutes", "hamstrings"],
    equipment: ["full_gym", "home_dumbbells", "bodyweight", "minimal"],
    cues: ["Upright torso", "Front knee stable", "Controlled steps"],
    progressiveOverload: "Add DBs or reverse-tempo",
    baseSets: 3,
    reps: "10/leg",
    restSec: 90,
  },
  {
    id: "leg-curl",
    name: "Lying Leg Curl",
    bodyParts: ["hamstrings"],
    equipment: ["full_gym"],
    cues: ["Hips pinned", "Full squeeze", "No bouncing"],
    progressiveOverload: "2-rep progressions before load jump",
    baseSets: 3,
    reps: "10–15",
    restSec: 75,
  },
  {
    id: "calf-raise",
    name: "Standing Calf Raise",
    bodyParts: ["calves"],
    equipment: ["full_gym", "home_dumbbells", "bodyweight", "minimal"],
    cues: ["Full stretch at bottom", "Pause at top", "No bounce"],
    progressiveOverload: "High volume; add load when 15+ is easy",
    baseSets: 4,
    reps: "12–20",
    restSec: 60,
  },
  {
    id: "curl",
    name: "Dumbbell Curl",
    bodyParts: ["biceps"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Elbows pinned", "Supinate hard", "Control negative"],
    progressiveOverload: "Strict form; add weight at 12 clean reps",
    baseSets: 3,
    reps: "8–12",
    restSec: 60,
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    bodyParts: ["triceps"],
    equipment: ["full_gym"],
    cues: ["Elbows locked in place", "Full extension", "Soft grip"],
    progressiveOverload: "Drop sets or load increase weekly",
    baseSets: 3,
    reps: "10–15",
    restSec: 60,
  },
  {
    id: "overhead-ext",
    name: "Overhead Tricep Extension",
    bodyParts: ["triceps"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Elbows forward", "Deep stretch", "No flare"],
    progressiveOverload: "Increase load when top range is easy",
    baseSets: 3,
    reps: "10–12",
    restSec: 75,
  },
  {
    id: "plank",
    name: "Front Plank",
    bodyParts: ["abs", "obliques"],
    equipment: ["bodyweight", "minimal", "home_dumbbells", "full_gym"],
    cues: ["Ribs down", "Glutes tight", "Neutral neck"],
    progressiveOverload: "Add 10–15s or weighted vest",
    baseSets: 3,
    reps: "30–60s",
    restSec: 45,
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    bodyParts: ["abs"],
    equipment: ["full_gym"],
    cues: ["Flex spine, not hips", "Exhale hard", "Controlled return"],
    progressiveOverload: "Heavier stack or slower tempo",
    baseSets: 3,
    reps: "12–15",
    restSec: 60,
  },
  {
    id: "farmer-carry",
    name: "Farmer's Carry",
    bodyParts: ["forearms", "traps", "abs"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Tall posture", "Crush grip", "Short steps"],
    progressiveOverload: "Heavier load or longer distance",
    baseSets: 3,
    reps: "30–40m",
    restSec: 90,
  },
  {
    id: "shrug",
    name: "Dumbbell Shrugs",
    bodyParts: ["traps"],
    equipment: ["full_gym", "home_dumbbells"],
    cues: ["Elevate straight up", "Pause at top", "No roll"],
    progressiveOverload: "Heavy, controlled — add weight weekly",
    baseSets: 3,
    reps: "10–15",
    restSec: 75,
  },
];

function equipmentMatch(
  ex: ExerciseTemplate,
  access: EquipmentAccess
): boolean {
  return ex.equipment.includes(access);
}

function setsForExperience(
  base: number,
  experience: ExperienceLevel
): number {
  if (experience === "beginner") return Math.max(2, base - 1);
  if (experience === "advanced") return base + 0;
  return base;
}

/** Map goal to preferred training split style (research-informed tags) */
function goalProgramHint(goal: GoalType): string {
  switch (goal) {
    case "build_muscle":
      return "Hypertrophy-focused volume (push/pull/legs inspired)";
    case "lose_fat":
      return "Full-body density with metabolic finishers";
    case "strength":
      return "Low-rep compound priority (starting-strength lineage)";
    case "athletic":
      return "Athletic performance blend — power + accessory work";
    case "recomposition":
    default:
      return "Balanced recomposition — lagging-part bias with compounds";
  }
}

function pickExercises(
  focus: BodyPartId[],
  equipment: EquipmentAccess,
  experience: ExperienceLevel,
  count: number
): Exercise[] {
  const scored = EXERCISE_DB.filter((e) => equipmentMatch(e, equipment))
    .map((e) => {
      const overlap = e.bodyParts.filter((p) => focus.includes(p)).length;
      const primary = focus.includes(e.bodyParts[0]) ? 2 : 0;
      return { e, score: overlap * 3 + primary };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected: ExerciseTemplate[] = [];
  const used = new Set<string>();

  for (const { e } of scored) {
    if (selected.length >= count) break;
    if (used.has(e.id)) continue;
    selected.push(e);
    used.add(e.id);
  }

  // Fill with compounds if short
  if (selected.length < count) {
    for (const e of EXERCISE_DB) {
      if (selected.length >= count) break;
      if (used.has(e.id)) continue;
      if (!equipmentMatch(e, equipment)) continue;
      selected.push(e);
      used.add(e.id);
    }
  }

  return selected.map((e) => ({
    id: e.id,
    name: e.name,
    bodyParts: e.bodyParts,
    equipment: e.equipment,
    cues: e.cues,
    progressiveOverload: e.progressiveOverload,
    sets: setsForExperience(e.baseSets, experience),
    reps: e.reps,
    restSec: e.restSec,
  }));
}

export function getTopLaggingParts(
  scores: BodyPartScore[],
  n = 3
): BodyPartScore[] {
  return [...scores]
    .sort((a, b) => a.score - b.score || a.priority - b.priority)
    .slice(0, n);
}

export function generateSession(opts: {
  metrics: UserMetrics;
  scores: BodyPartScore[];
  goal: GoalType;
  date: string;
  availableMinutes?: number;
  dayIndex?: number; // 0–6 for weekly rotation
}): WorkoutSession {
  const {
    metrics,
    scores,
    goal,
    date,
    availableMinutes = 55,
    dayIndex = new Date(date).getDay(),
  } = opts;

  const lagging = scores.length
    ? getTopLaggingParts(scores, 4)
    : [];
  const lagIds = lagging.map((s) => s.id);

  // Simple weekly rotation bias
  const rotation: BodyPartId[][] = [
    ["chest", "shoulders", "triceps"], // push-ish
    ["lats", "mid_back", "biceps"], // pull-ish
    ["quads", "glutes", "hamstrings", "calves"], // legs
    ["shoulders", "chest", "lats"], // upper mix
    ["glutes", "hamstrings", "abs"], // posterior + core
    ["biceps", "triceps", "forearms", "abs"], // arms + core
    [], // rest potential
  ];

  const dayParts = rotation[dayIndex % 7];
  const isRest =
    dayIndex % 7 === 0 && metrics.experience === "beginner"
      ? false
      : dayParts.length === 0;

  // Merge lagging with day focus
  const focusParts: BodyPartId[] = [];
  for (const id of [...lagIds.slice(0, 2), ...dayParts]) {
    if (!focusParts.includes(id)) focusParts.push(id);
  }
  const finalFocus = focusParts.slice(0, 4);

  const exerciseCount =
    availableMinutes < 35 ? 4 : availableMinutes < 50 ? 5 : 6;

  const exercises = pickExercises(
    finalFocus.length ? finalFocus : lagIds,
    metrics.equipment,
    metrics.experience,
    exerciseCount
  );

  // Split into main + accessories
  const main = exercises.slice(0, Math.min(3, exercises.length));
  const accessories = exercises.slice(main.length);

  const focusLabels = finalFocus
    .map((id) => BODY_PART_LABELS[id])
    .join(", ");

  const lagReasons = lagging
    .slice(0, 2)
    .map((s) => s.reason || `${s.label} underscored relative to frame`)
    .join("; ");

  const title =
    dayIndex % 7 === 2
      ? "Lower Focus"
      : dayIndex % 7 === 0 || dayIndex % 7 === 3
        ? "Upper Priority"
        : "Blueprint Session";

  return {
    id: `session-${date}`,
    date,
    title,
    focusParts: finalFocus,
    focusReason:
      lagReasons ||
      `${goalProgramHint(goal)}. Emphasizing ${focusLabels}.`,
    estimatedMinutes: availableMinutes,
    blocks: [
      {
        name: "Primary compounds",
        exercises: main,
      },
      ...(accessories.length
        ? [
            {
              name: "Accessories & weak-point work",
              exercises: accessories,
            },
          ]
        : []),
    ],
    completed: false,
  };
}

export function exercisesForBodyPart(
  part: BodyPartId,
  equipment: EquipmentAccess,
  experience: ExperienceLevel
): Exercise[] {
  return pickExercises([part], equipment, experience, 5);
}

export { goalProgramHint, EXERCISE_DB };
