"use client";

import { create } from "zustand";
import type {
  ChatMessage,
  CoachExtraction,
  MealLog,
  PhysiqueUpdate,
  UserJournal,
  WorkoutLog,
  WeightLog,
  StepsLog,
  GoalChangeLog,
  ExercisePreference,
} from "@/types/journal";
import { emptyJournal } from "@/types/journal";
import {
  applyCoachExtraction,
  applyManualMeal,
  applyManualWorkout,
  estimateMealMacros,
} from "@/lib/journal/apply";
import { useAppStore } from "@/store/useAppStore";
import { generateSession } from "@/lib/workout-engine";
import { buildNutritionTargets } from "@/lib/nutrition";
import type { BodyPartScore, GoalType, NutritionPhase } from "@/types";
import { scoreToPriority, scoreToStatus, BODY_PART_LABELS } from "@/lib/body-parts";

interface JournalState {
  journal: UserJournal;
  setJournal: (j: UserJournal) => void;
  resetJournal: () => void;

  addWorkout: (
    log: Omit<WorkoutLog, "id" | "createdAt" | "source"> & {
      source?: WorkoutLog["source"];
    }
  ) => string;
  addMeal: (opts: {
    date: string;
    name: string;
    description?: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }) => string;
  addWeight: (opts: {
    date: string;
    weightKg: number;
    note?: string;
  }) => string;
  addSteps: (opts: { date: string; steps: number }) => string;
  setPreference: (
    exerciseName: string,
    feeling: ExercisePreference["feeling"],
    note?: string
  ) => void;
  changeGoal: (newGoal: GoalType, phase?: NutritionPhase, note?: string) => void;

  appendChat: (msg: Omit<ChatMessage, "id" | "createdAt"> & { id?: string }) => void;
  applyExtraction: (extraction: CoachExtraction) => ChatMessage["applied"];

  applyPhysiqueUpdate: (update: Omit<PhysiqueUpdate, "id" | "createdAt" | "source">) => void;

  deleteWorkout: (id: string) => void;
  deleteMeal: (id: string) => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function persistSoon() {
  queueMicrotask(() => {
    void import("@/store/useAuthStore").then(({ syncBlueprintToAccount }) => {
      syncBlueprintToAccount();
    });
  });
}

function refreshAgendaFromProfile() {
  const { profile, nutritionPhase, journal } = {
    ...useAppStore.getState(),
    journal: useJournalStore.getState().journal,
  };
  if (!profile) return;
  const disliked = new Set(
    journal.preferences
      .filter((p) => p.feeling === "disliked")
      .map((p) => p.exerciseName.toLowerCase())
  );
  const today = new Date().toISOString().slice(0, 10);
  let session = generateSession({
    metrics: profile.metrics,
    scores: profile.bodyPartScores,
    goal: profile.goal.type,
    date: today,
  });
  // Soft-filter disliked exercises
  if (disliked.size) {
    session = {
      ...session,
      blocks: session.blocks.map((b) => ({
        ...b,
        exercises: b.exercises.filter(
          (e) => !disliked.has(e.name.toLowerCase())
        ),
      })).filter((b) => b.exercises.length > 0),
    };
  }
  const nutrition = buildNutritionTargets(profile.metrics, nutritionPhase);
  useAppStore.setState({
    agenda: {
      date: today,
      session,
      isRestDay: false,
      nutrition,
      recovery: {
        score: 72,
        label: "moderate",
        note: "Agenda refreshed from latest logs and preferences.",
      },
      priorityParts: session.focusParts,
      priorityReason: session.focusReason,
    },
  });
}

export const useJournalStore = create<JournalState>((set, get) => ({
  journal: emptyJournal(),

  setJournal: (j) =>
    set({
      journal: {
        ...emptyJournal(),
        ...j,
        workouts: j?.workouts || [],
        meals: j?.meals || [],
        weights: j?.weights || [],
        steps: j?.steps || [],
        goalChanges: j?.goalChanges || [],
        preferences: j?.preferences || [],
        physiqueUpdates: j?.physiqueUpdates || [],
        chat: j?.chat || [],
      },
    }),

  resetJournal: () => set({ journal: emptyJournal() }),

  addWorkout: (log) => {
    const id = uid();
    const entry: WorkoutLog = {
      ...log,
      id,
      source: log.source || "manual",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      journal: { ...s.journal, workouts: [entry, ...s.journal.workouts] },
    }));
    persistSoon();
    return id;
  },

  addMeal: (opts) => {
    const macros = estimateMealMacros(opts.name, opts.description, {
      calories: opts.calories,
      proteinG: opts.proteinG,
      carbsG: opts.carbsG,
      fatG: opts.fatG,
    });
    const id = uid();
    const entry: MealLog = {
      id,
      date: opts.date,
      name: opts.name,
      description: opts.description,
      macros,
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      journal: { ...s.journal, meals: [entry, ...s.journal.meals] },
    }));
    persistSoon();
    return id;
  },

  addWeight: (opts) => {
    const id = uid();
    const entry: WeightLog = {
      id,
      date: opts.date,
      weightKg: opts.weightKg,
      note: opts.note,
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      journal: { ...s.journal, weights: [entry, ...s.journal.weights] },
    }));
    const profile = useAppStore.getState().profile;
    if (profile) {
      useAppStore.setState({
        profile: {
          ...profile,
          metrics: { ...profile.metrics, weightKg: opts.weightKg },
          updatedAt: new Date().toISOString(),
        },
      });
      // refresh nutrition targets
      const phase = useAppStore.getState().nutritionPhase;
      const nutrition = buildNutritionTargets(
        { ...profile.metrics, weightKg: opts.weightKg },
        phase
      );
      const agenda = useAppStore.getState().agenda;
      if (agenda) {
        useAppStore.setState({
          agenda: { ...agenda, nutrition },
        });
      }
    }
    persistSoon();
    return id;
  },

  addSteps: (opts) => {
    const id = uid();
    const entry: StepsLog = {
      id,
      date: opts.date,
      steps: opts.steps,
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      journal: { ...s.journal, steps: [entry, ...s.journal.steps] },
    }));
    persistSoon();
    return id;
  },

  setPreference: (exerciseName, feeling, note) => {
    set((s) => {
      const key = exerciseName.trim().toLowerCase();
      const prefs = [...s.journal.preferences];
      const idx = prefs.findIndex((p) => p.exerciseName.toLowerCase() === key);
      const entry: ExercisePreference = {
        exerciseName: exerciseName.trim(),
        feeling,
        updatedAt: new Date().toISOString(),
        note,
      };
      if (idx >= 0) prefs[idx] = entry;
      else prefs.unshift(entry);
      return { journal: { ...s.journal, preferences: prefs } };
    });
    refreshAgendaFromProfile();
    persistSoon();
  },

  changeGoal: (newGoal, phase, note) => {
    const profile = useAppStore.getState().profile;
    const prev = profile?.goal.type;
    const entry: GoalChangeLog = {
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      previousGoal: prev,
      newGoal,
      phase,
      note,
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      journal: {
        ...s.journal,
        goalChanges: [entry, ...s.journal.goalChanges],
      },
    }));
    if (profile) {
      useAppStore.setState({
        profile: {
          ...profile,
          goal: { ...profile.goal, type: newGoal },
          updatedAt: new Date().toISOString(),
        },
      });
    }
    if (phase) {
      useAppStore.getState().setNutritionPhase(phase);
    } else {
      refreshAgendaFromProfile();
    }
    persistSoon();
  },

  appendChat: (msg) => {
    const entry: ChatMessage = {
      id: msg.id || uid(),
      role: msg.role,
      content: msg.content,
      createdAt: new Date().toISOString(),
      applied: msg.applied,
    };
    set((s) => ({
      journal: {
        ...s.journal,
        chat: [...s.journal.chat, entry].slice(-60),
      },
    }));
    persistSoon();
  },

  applyExtraction: (extraction) => {
    const profile = useAppStore.getState().profile;
    const nutritionPhase = useAppStore.getState().nutritionPhase;
    const result = applyCoachExtraction(
      get().journal,
      extraction,
      profile,
      nutritionPhase
    );
    set({ journal: result.journal });
    if (result.profile) {
      useAppStore.setState({ profile: result.profile });
    }
    if (result.nutritionPhase && result.nutritionPhase !== nutritionPhase) {
      useAppStore.getState().setNutritionPhase(result.nutritionPhase);
    } else if (result.profile) {
      refreshAgendaFromProfile();
    }
    persistSoon();
    return result.applied;
  },

  applyPhysiqueUpdate: (update) => {
    const profile = useAppStore.getState().profile;
    const previousScores = profile?.bodyPartScores;
    const normalized: BodyPartScore[] = update.scores.map((s) => ({
      ...s,
      label: s.label || BODY_PART_LABELS[s.id] || s.id,
      status: s.status || scoreToStatus(s.score),
      priority: s.priority || scoreToPriority(s.score),
    }));

    const entry: PhysiqueUpdate = {
      ...update,
      id: uid(),
      previousScores: update.previousScores || previousScores,
      scores: normalized,
      source: "manual",
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      journal: {
        ...s.journal,
        physiqueUpdates: [entry, ...s.journal.physiqueUpdates],
      },
    }));

    if (profile) {
      useAppStore.setState({
        profile: {
          ...profile,
          bodyPartScores: normalized,
          updatedAt: new Date().toISOString(),
        },
      });
      refreshAgendaFromProfile();
    }
    persistSoon();
  },

  deleteWorkout: (id) => {
    set((s) => ({
      journal: {
        ...s.journal,
        workouts: s.journal.workouts.filter((w) => w.id !== id),
      },
    }));
    persistSoon();
  },

  deleteMeal: (id) => {
    set((s) => ({
      journal: {
        ...s.journal,
        meals: s.journal.meals.filter((m) => m.id !== id),
      },
    }));
    persistSoon();
  },
}));

// Re-export helpers used by manual forms
export { applyManualMeal, applyManualWorkout };
