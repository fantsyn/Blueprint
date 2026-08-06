import type {
  BodyPartId,
  BodyPartScore,
  GoalType,
  MacroTargets,
  NutritionPhase,
  PhotoPose,
} from "./index";

export type LogSource = "chat" | "manual" | "system";

export interface LoggedSet {
  reps: number;
  weightKg?: number;
  rpe?: number;
}

export interface LoggedExercise {
  name: string;
  bodyParts?: BodyPartId[];
  sets: LoggedSet[];
  notes?: string;
}

export type WorkoutFeeling = "liked" | "disliked" | "neutral";

export interface WorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  exercises: LoggedExercise[];
  durationMin?: number;
  intensity?: number; // 1–10
  steps?: number;
  feeling?: WorkoutFeeling;
  notes?: string;
  source: LogSource;
  createdAt: string;
}

export interface MealLog {
  id: string;
  date: string;
  name: string;
  description?: string;
  macros: MacroTargets;
  source: LogSource;
  createdAt: string;
}

export interface WeightLog {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
  source: LogSource;
  createdAt: string;
}

export interface StepsLog {
  id: string;
  date: string;
  steps: number;
  source: LogSource;
  createdAt: string;
}

export interface GoalChangeLog {
  id: string;
  date: string;
  previousGoal?: GoalType;
  newGoal: GoalType;
  phase?: NutritionPhase;
  note?: string;
  source: LogSource;
  createdAt: string;
}

export interface ExercisePreference {
  exerciseName: string;
  feeling: WorkoutFeeling;
  updatedAt: string;
  note?: string;
}

export interface PhysiqueUpdate {
  id: string;
  date: string;
  poses: PhotoPose[];
  /** true if photos were analyzed this session (not persisted as base64) */
  hadPhotos: boolean;
  scores: BodyPartScore[];
  previousScores?: BodyPartScore[];
  summary: string;
  workoutAdjustments: string[];
  nutritionNotes: string[];
  whatsWorking: string[];
  needsChange: string[];
  source: LogSource;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  /** Structured actions applied from this message */
  applied?: AppliedLogAction[];
}

export interface AppliedLogAction {
  type:
    | "workout"
    | "meal"
    | "weight"
    | "steps"
    | "goal"
    | "preference"
    | "note";
  summary: string;
  refId?: string;
}

export interface UserJournal {
  workouts: WorkoutLog[];
  meals: MealLog[];
  weights: WeightLog[];
  steps: StepsLog[];
  goalChanges: GoalChangeLog[];
  preferences: ExercisePreference[];
  physiqueUpdates: PhysiqueUpdate[];
  chat: ChatMessage[];
}

export function emptyJournal(): UserJournal {
  return {
    workouts: [],
    meals: [],
    weights: [],
    steps: [],
    goalChanges: [],
    preferences: [],
    physiqueUpdates: [],
    chat: [],
  };
}

/** Payload the AI coach returns for structured logging */
export interface CoachExtraction {
  reply: string;
  actions: Array<
    | {
        type: "workout";
        date?: string;
        title?: string;
        exercises: LoggedExercise[];
        durationMin?: number;
        intensity?: number;
        steps?: number;
        feeling?: WorkoutFeeling;
        notes?: string;
      }
    | {
        type: "meal";
        date?: string;
        name: string;
        description?: string;
        calories?: number;
        proteinG?: number;
        carbsG?: number;
        fatG?: number;
      }
    | {
        type: "weight";
        date?: string;
        weightKg: number;
        note?: string;
      }
    | {
        type: "steps";
        date?: string;
        steps: number;
      }
    | {
        type: "goal";
        newGoal: GoalType;
        phase?: NutritionPhase;
        note?: string;
      }
    | {
        type: "preference";
        exerciseName: string;
        feeling: WorkoutFeeling;
        note?: string;
      }
    | {
        type: "none";
      }
  >;
}
