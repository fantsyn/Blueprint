/** Core domain types for Blueprint */

export type Sex = "male" | "female" | "other";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type EquipmentAccess =
  | "full_gym"
  | "home_dumbbells"
  | "bodyweight"
  | "minimal";
export type GoalType =
  | "recomposition"
  | "build_muscle"
  | "lose_fat"
  | "strength"
  | "athletic";
export type NutritionPhase = "maintain" | "bulk" | "cut";
export type PhotoPose = "front" | "side" | "back";

export type BodyPartId =
  | "traps"
  | "shoulders"
  | "chest"
  | "lats"
  | "mid_back"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

export interface BodyPartScore {
  id: BodyPartId;
  label: string;
  /** 0–100 relative development score */
  score: number;
  /** lagging | balanced | strong */
  status: "lagging" | "balanced" | "strong";
  priority: number;
  reason?: string;
}

export interface UserMetrics {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  experience: ExperienceLevel;
  equipment: EquipmentAccess;
  injuries: string[];
}

export interface PhysiquePhoto {
  pose: PhotoPose;
  url: string;
  capturedAt: string;
}

export interface InspoImage {
  id: string;
  url: string;
  notes?: string;
}

export interface Goal {
  type: GoalType;
  description?: string;
  targetWeightKg?: number;
  inspoImages: InspoImage[];
}

export interface UserProfile {
  id: string;
  name: string;
  metrics: UserMetrics;
  goal: Goal;
  photos: PhysiquePhoto[];
  bodyPartScores: BodyPartScore[];
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  bodyParts: BodyPartId[];
  equipment: EquipmentAccess[];
  cues: string[];
  progressiveOverload: string;
  sets: number;
  reps: string;
  restSec: number;
}

export interface WorkoutBlock {
  name: string;
  exercises: Exercise[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  title: string;
  focusParts: BodyPartId[];
  focusReason: string;
  estimatedMinutes: number;
  blocks: WorkoutBlock[];
  completed: boolean;
}

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionTargets {
  phase: NutritionPhase;
  maintain: MacroTargets;
  bulk: MacroTargets;
  cut: MacroTargets;
  active: MacroTargets;
}

export interface RecoveryIndicator {
  score: number; // 0–100
  label: "low" | "moderate" | "high";
  note: string;
}

export interface MeasurementEntry {
  date: string;
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  thighsCm?: number;
}

export interface StrengthEntry {
  exerciseId: string;
  exerciseName: string;
  date: string;
  weightKg: number;
  reps: number;
}

export interface ProgressSnapshot {
  photos: PhysiquePhoto[];
  measurements: MeasurementEntry[];
  strength: StrengthEntry[];
  bodyPartScores: BodyPartScore[];
}

export interface DayAgenda {
  date: string;
  session: WorkoutSession | null;
  isRestDay: boolean;
  restNote?: string;
  nutrition: NutritionTargets;
  recovery: RecoveryIndicator;
  priorityParts: BodyPartId[];
  priorityReason: string;
}
