"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type {
  BodyPartId,
  DayAgenda,
  Goal,
  NutritionPhase,
  PhysiquePhoto,
  UserMetrics,
  UserProfile,
} from "@/types";
import { MOCK_PROFILE, buildTodayAgenda } from "@/data/mock";
import { BODY_PART_LABELS, scoreToPriority, scoreToStatus } from "@/lib/body-parts";
import { buildNutritionTargets } from "@/lib/nutrition";
import { generateSession } from "@/lib/workout-engine";

interface OnboardingDraft {
  step: number;
  name: string;
  metrics: Partial<UserMetrics>;
  /** Kept in memory only — base64 is too large for localStorage */
  photos: Partial<Record<PhysiquePhoto["pose"], string>>;
  goal: Partial<Goal>;
  inspoUrls: string[];
}

interface AppState {
  profile: UserProfile | null;
  agenda: DayAgenda | null;
  selectedBodyPart: BodyPartId | null;
  nutritionPhase: NutritionPhase;
  onboarding: OnboardingDraft;
  hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  setSelectedBodyPart: (id: BodyPartId | null) => void;
  setNutritionPhase: (phase: NutritionPhase) => void;
  setOnboardingStep: (step: number) => void;
  updateOnboarding: (partial: Partial<OnboardingDraft>) => void;
  updateMetrics: (metrics: Partial<UserMetrics>) => void;
  completeOnboarding: () => void;
  loadDemo: () => void;
  reset: () => void;
  regenerateAgenda: () => void;
}

const initialOnboarding: OnboardingDraft = {
  step: 0,
  name: "",
  metrics: {
    age: 28,
    sex: "male",
    heightCm: 175,
    weightKg: 75,
    experience: "intermediate",
    equipment: "full_gym",
    injuries: [],
  },
  photos: {},
  goal: { type: "recomposition", inspoImages: [] },
  inspoUrls: [],
};

type BodyPartScoreId = keyof typeof BODY_PART_LABELS;

/** Heuristic body-part scores when vision AI is not available */
function heuristicScores(metrics: UserMetrics, goalType: string) {
  const base: Record<string, number> = {
    traps: 55,
    shoulders: 50,
    chest: 55,
    lats: 48,
    mid_back: 50,
    biceps: 52,
    triceps: 52,
    forearms: 55,
    abs: 48,
    obliques: 50,
    glutes: 50,
    quads: 58,
    hamstrings: 48,
    calves: 52,
  };

  if (metrics.experience === "beginner") {
    base.lats -= 8;
    base.hamstrings -= 6;
    base.shoulders -= 5;
  }

  if (goalType === "build_muscle" || goalType === "recomposition") {
    base.shoulders -= 4;
    base.lats -= 5;
  }

  if (metrics.sex === "female") {
    base.glutes += 5;
    base.quads += 3;
    base.chest -= 5;
  }

  const injuries = (metrics.injuries || []).join(" ").toLowerCase();
  if (injuries.includes("shoulder")) {
    base.shoulders -= 6;
    base.chest -= 3;
  }
  if (injuries.includes("knee")) {
    base.quads -= 4;
  }
  if (injuries.includes("lower back") || injuries.includes("back")) {
    base.mid_back -= 4;
    base.hamstrings -= 3;
  }

  const reasons: Partial<Record<string, string>> = {
    lats: "Relative width lags torso thickness — prioritising pull volume",
    shoulders: "Lateral development underscored vs pressing strength",
    hamstrings: "Posterior chain balance vs quads needs attention",
    glutes: "Hip extension strength underrepresented in current pattern",
  };

  return (Object.keys(base) as (keyof typeof base)[])
    .filter((id) => id in BODY_PART_LABELS)
    .map((id) => {
      const score = Math.max(25, Math.min(90, Math.round(base[id]!)));
      return {
        id: id as BodyPartScoreId,
        label: BODY_PART_LABELS[id as BodyPartScoreId],
        score,
        status: scoreToStatus(score),
        priority: scoreToPriority(score),
        reason: score < 48 ? reasons[id] : undefined,
      };
    });
}

/** Drop huge base64 payloads so localStorage stays under quota */
function stripDataUrls(photos: PhysiquePhoto[]): PhysiquePhoto[] {
  return photos
    .filter((p) => p.url && !p.url.startsWith("data:"))
    .map((p) => ({ ...p }));
}

function slimProfile(profile: UserProfile | null): UserProfile | null {
  if (!profile) return null;
  return {
    ...profile,
    photos: stripDataUrls(profile.photos),
    goal: {
      ...profile.goal,
      inspoImages: (profile.goal.inspoImages || []).filter(
        (img) => img.url && !img.url.startsWith("data:")
      ),
    },
  };
}

/** Safe localStorage — never throw QuotaExceededError into React */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Quota full — try clearing our key and rewriting a slim payload once
      try {
        localStorage.removeItem(name);
        localStorage.setItem(name, value);
      } catch {
        console.warn(
          "[blueprint] localStorage full — profile kept in memory only this session"
        );
      }
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      agenda: null,
      selectedBodyPart: null,
      nutritionPhase: "maintain",
      onboarding: initialOnboarding,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      setSelectedBodyPart: (id) => set({ selectedBodyPart: id }),

      setNutritionPhase: (phase) => {
        const { profile, agenda } = get();
        if (!profile || !agenda) {
          set({ nutritionPhase: phase });
          return;
        }
        const nutrition = buildNutritionTargets(profile.metrics, phase);
        set({
          nutritionPhase: phase,
          agenda: { ...agenda, nutrition },
        });
        queueMicrotask(() => {
          void import("@/store/useAuthStore").then(({ syncBlueprintToAccount }) => {
            syncBlueprintToAccount();
          });
        });
      },

      setOnboardingStep: (step) =>
        set((s) => ({ onboarding: { ...s.onboarding, step } })),

      updateOnboarding: (partial) =>
        set((s) => ({
          onboarding: { ...s.onboarding, ...partial },
        })),

      updateMetrics: (metrics) =>
        set((s) => ({
          onboarding: {
            ...s.onboarding,
            metrics: { ...s.onboarding.metrics, ...metrics },
          },
        })),

      completeOnboarding: () => {
        const { onboarding, nutritionPhase } = get();
        const metrics: UserMetrics = {
          age: Number(onboarding.metrics.age) || 28,
          sex: onboarding.metrics.sex || "male",
          heightCm: Number(onboarding.metrics.heightCm) || 175,
          weightKg: Number(onboarding.metrics.weightKg) || 75,
          bodyFatPct: onboarding.metrics.bodyFatPct,
          experience: onboarding.metrics.experience || "intermediate",
          equipment: onboarding.metrics.equipment || "full_gym",
          injuries: onboarding.metrics.injuries || [],
        };
        const goalType = onboarding.goal.type || "recomposition";
        const scores = heuristicScores(metrics, goalType);

        // Keep photos in memory for this session (progress UI), but they
        // are stripped on persist so localStorage never explodes.
        const photos = (
          Object.entries(onboarding.photos) as [PhysiquePhoto["pose"], string][]
        )
          .filter(([, url]) => url)
          .map(([pose, url]) => ({
            pose,
            url,
            capturedAt: new Date().toISOString(),
          }));

        const profile: UserProfile = {
          id: `profile-${Date.now()}`,
          name: (onboarding.name || "Athlete").trim() || "Athlete",
          metrics,
          goal: {
            type: goalType,
            description: onboarding.goal.description,
            targetWeightKg: onboarding.goal.targetWeightKg,
            inspoImages: (onboarding.inspoUrls || [])
              .filter((url) => url && !url.startsWith("data:"))
              .map((url, i) => ({
                id: `inspo-${i}`,
                url,
              })),
          },
          photos,
          bodyPartScores: scores,
          onboardingComplete: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const today = new Date().toISOString().slice(0, 10);
        const session = generateSession({
          metrics: profile.metrics,
          scores: profile.bodyPartScores,
          goal: profile.goal.type,
          date: today,
        });
        const nutrition = buildNutritionTargets(
          profile.metrics,
          nutritionPhase
        );

        set({
          profile,
          agenda: {
            date: today,
            session,
            isRestDay: false,
            nutrition,
            recovery: {
              score: 75,
              label: "moderate",
              note: "Blueprint generated. First week prioritises form and lagging regions.",
            },
            priorityParts: session.focusParts,
            priorityReason: session.focusReason,
          },
          // Keep name in draft for display; step reset is fine after complete
          onboarding: {
            ...initialOnboarding,
            step: 0,
            name: profile.name,
          },
          hasHydrated: true,
        });
      },

      loadDemo: () => {
        try {
          localStorage.removeItem("blueprint-app");
        } catch {
          /* ignore */
        }
        const agenda = buildTodayAgenda(MOCK_PROFILE);
        set({
          profile: MOCK_PROFILE,
          agenda,
          nutritionPhase: agenda.nutrition.phase,
          hasHydrated: true,
        });
      },

      reset: () => {
        try {
          localStorage.removeItem("blueprint-app");
        } catch {
          /* ignore */
        }
        set({
          profile: null,
          agenda: null,
          selectedBodyPart: null,
          nutritionPhase: "maintain",
          onboarding: initialOnboarding,
          hasHydrated: true,
        });
      },

      regenerateAgenda: () => {
        const { profile, nutritionPhase } = get();
        if (!profile) return;
        const agenda = buildTodayAgenda(profile);
        agenda.nutrition = buildNutritionTargets(
          profile.metrics,
          nutritionPhase
        );
        set({ agenda });
      },
    }),
    {
      name: "blueprint-app",
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        // Never write base64 photos or draft photo uploads
        profile: slimProfile(s.profile),
        agenda: s.agenda,
        nutritionPhase: s.nutritionPhase,
        onboarding: {
          ...s.onboarding,
          photos: {},
          inspoUrls: (s.onboarding.inspoUrls || []).filter(
            (u) => u && !u.startsWith("data:")
          ),
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        if (!p) return current;
        return {
          ...current,
          ...p,
          profile: slimProfile(p.profile ?? null),
          onboarding: {
            ...initialOnboarding,
            ...(p.onboarding || {}),
            photos: {},
          },
          // Always start false; onFinishHydration sets true
          hasHydrated: false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[blueprint] rehydrate failed", error);
          try {
            localStorage.removeItem("blueprint-app");
          } catch {
            /* ignore */
          }
        }
        // Rewrite slim payload so next session starts clean
        try {
          if (state?.profile) {
            const slim = JSON.stringify({
              state: {
                profile: slimProfile(state.profile),
                agenda: state.agenda,
                nutritionPhase: state.nutritionPhase,
                onboarding: { ...initialOnboarding, step: 0 },
              },
              version: 0,
            });
            localStorage.setItem("blueprint-app", slim);
          }
        } catch {
          try {
            localStorage.removeItem("blueprint-app");
          } catch {
            /* ignore */
          }
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
