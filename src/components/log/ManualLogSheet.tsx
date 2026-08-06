"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useJournalStore } from "@/store/useJournalStore";
import type { GoalType, NutritionPhase } from "@/types";
import type { WorkoutFeeling } from "@/types/journal";

export type LogKind =
  | "workout"
  | "meal"
  | "weight"
  | "steps"
  | "preference"
  | "goal";

interface ManualLogSheetProps {
  open: boolean;
  kind: LogKind;
  onClose: () => void;
}

export function ManualLogSheet({ open, kind, onClose }: ManualLogSheetProps) {
  const addWorkout = useJournalStore((s) => s.addWorkout);
  const addMeal = useJournalStore((s) => s.addMeal);
  const addWeight = useJournalStore((s) => s.addWeight);
  const addSteps = useJournalStore((s) => s.addSteps);
  const setPreference = useJournalStore((s) => s.setPreference);
  const changeGoal = useJournalStore((s) => s.changeGoal);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8");
  const [weightKg, setWeightKg] = useState("");
  const [intensity, setIntensity] = useState("7");
  const [mealName, setMealName] = useState("");
  const [mealDesc, setMealDesc] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [steps, setSteps] = useState("");
  const [feeling, setFeeling] = useState<WorkoutFeeling>("neutral");
  const [goal, setGoal] = useState<GoalType>("recomposition");
  const [phase, setPhase] = useState<NutritionPhase>("maintain");
  const [error, setError] = useState<string | null>(null);

  const titles: Record<LogKind, string> = {
    workout: "Log workout",
    meal: "Log meal",
    weight: "Log weight",
    steps: "Log steps",
    preference: "Exercise preference",
    goal: "Update goal",
  };

  const submit = () => {
    setError(null);
    try {
      if (kind === "workout") {
        if (!exercise.trim()) {
          setError("Add at least one exercise name");
          return;
        }
        const nSets = Math.max(1, Number(sets) || 1);
        const nReps = Math.max(1, Number(reps) || 1);
        const w = weightKg ? Number(weightKg) : undefined;
        addWorkout({
          date,
          title: title || exercise,
          exercises: [
            {
              name: exercise.trim(),
              sets: Array.from({ length: Math.min(nSets, 12) }, () => ({
                reps: nReps,
                weightKg: w,
              })),
            },
          ],
          intensity: Number(intensity) || undefined,
          feeling,
        });
      }
      if (kind === "meal") {
        if (!mealName.trim()) {
          setError("Meal name required");
          return;
        }
        addMeal({
          date,
          name: mealName.trim(),
          description: mealDesc || undefined,
          calories: calories ? Number(calories) : undefined,
          proteinG: protein ? Number(protein) : undefined,
          carbsG: carbs ? Number(carbs) : undefined,
          fatG: fat ? Number(fat) : undefined,
        });
      }
      if (kind === "weight") {
        if (!bodyWeight) {
          setError("Weight required");
          return;
        }
        addWeight({ date, weightKg: Number(bodyWeight) });
      }
      if (kind === "steps") {
        if (!steps) {
          setError("Steps required");
          return;
        }
        addSteps({ date, steps: Number(steps) });
      }
      if (kind === "preference") {
        if (!exercise.trim()) {
          setError("Exercise name required");
          return;
        }
        setPreference(exercise.trim(), feeling);
      }
      if (kind === "goal") {
        changeGoal(goal, phase);
      }
      onClose();
    } catch {
      setError("Could not save");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md glass-elevated rounded-t-[var(--radius-2xl)] p-5 sm:p-6 pb-safe sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-xl)] sm:max-h-[90dvh] overflow-y-auto border border-border"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="eyebrow mb-1">Manual entry</p>
                <h2 className="text-[15px] font-medium text-primary tracking-tight">
                  {titles[kind]}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-[var(--radius-md)] text-tertiary hover:text-primary hover:bg-hover transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {kind !== "preference" && kind !== "goal" && (
                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              )}

              {kind === "workout" && (
                <>
                  <Input
                    label="Session title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Push day"
                  />
                  <Input
                    label="Exercise"
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    placeholder="Barbell Bench Press"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Sets"
                      mono
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                    />
                    <Input
                      label="Reps"
                      mono
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                    />
                    <Input
                      label="kg"
                      mono
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Intensity 1–10"
                    mono
                    type="number"
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value)}
                  />
                  <div>
                    <p className="text-xs text-secondary mb-2">Feeling</p>
                    <SegmentedControl
                      size="sm"
                      value={feeling}
                      onChange={setFeeling}
                      options={[
                        { value: "liked", label: "Like" },
                        { value: "neutral", label: "OK" },
                        { value: "disliked", label: "Dislike" },
                      ]}
                    />
                  </div>
                </>
              )}

              {kind === "meal" && (
                <>
                  <Input
                    label="Meal"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="Chicken rice bowl"
                  />
                  <Input
                    label="Details (optional)"
                    value={mealDesc}
                    onChange={(e) => setMealDesc(e.target.value)}
                    placeholder="200g chicken, rice, olive oil"
                  />
                  <p className="text-[11px] text-muted">
                    Leave macros blank to auto-estimate from description.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="kcal"
                      mono
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                    />
                    <Input
                      label="Protein g"
                      mono
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                    <Input
                      label="Carbs g"
                      mono
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                    <Input
                      label="Fat g"
                      mono
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                  </div>
                </>
              )}

              {kind === "weight" && (
                <Input
                  label="Weight (kg)"
                  mono
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                />
              )}

              {kind === "steps" && (
                <Input
                  label="Steps"
                  mono
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
              )}

              {kind === "preference" && (
                <>
                  <Input
                    label="Exercise"
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    placeholder="Romanian Deadlift"
                  />
                  <SegmentedControl
                    size="sm"
                    value={feeling}
                    onChange={setFeeling}
                    options={[
                      { value: "liked", label: "Like" },
                      { value: "neutral", label: "OK" },
                      { value: "disliked", label: "Dislike" },
                    ]}
                  />
                </>
              )}

              {kind === "goal" && (
                <>
                  <Select
                    label="Goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as GoalType)}
                    options={[
                      { value: "recomposition", label: "Recomposition" },
                      { value: "build_muscle", label: "Build muscle" },
                      { value: "lose_fat", label: "Lose fat" },
                      { value: "strength", label: "Strength" },
                      { value: "athletic", label: "Athletic" },
                    ]}
                  />
                  <Select
                    label="Nutrition phase"
                    value={phase}
                    onChange={(e) =>
                      setPhase(e.target.value as NutritionPhase)
                    }
                    options={[
                      { value: "cut", label: "Cut" },
                      { value: "maintain", label: "Maintain" },
                      { value: "bulk", label: "Build" },
                    ]}
                  />
                </>
              )}

              {error && (
                <p className="text-sm text-[#c47a6a]">{error}</p>
              )}

              <Button className="w-full" size="lg" onClick={submit}>
                Save
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
