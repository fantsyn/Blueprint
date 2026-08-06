import type { BodyPartId, GoalType, UserMetrics } from "@/types";
import { BODY_PART_LABELS, ALL_BODY_PARTS } from "@/lib/body-parts";

/** Structured prompt for relative body-part scoring from guided photos */
export function physiqueAnalysisPrompt(metrics: UserMetrics): string {
  const parts = ALL_BODY_PARTS.map((id) => BODY_PART_LABELS[id]).join(", ");
  return `You are a precision physique analyst for Blueprint, a calm technical fitness product.

Given the user's guided front/side/back physique photos and metrics, score relative muscle development.

Metrics:
- Age: ${metrics.age}
- Sex: ${metrics.sex}
- Height: ${metrics.heightCm} cm
- Weight: ${metrics.weightKg} kg
- Body fat (if known): ${metrics.bodyFatPct ?? "unknown"}%
- Experience: ${metrics.experience}
- Injuries: ${metrics.injuries?.join("; ") || "none"}

Body parts to score (0–100 relative to the individual's frame, not absolute standards):
${parts}

Rules:
- Score is RELATIVE within this physique — the strongest region ~70–85, lagging ~30–45.
- Do not use bodybuilding stage standards; use proportional aesthetics + performance balance.
- Flag injury-related caution in reasons when relevant.
- Be concise and clinical — no hype language.

Return ONLY valid JSON:
{
  "scores": [
    { "id": "<body_part_id>", "score": <number>, "reason": "<optional short reason if lagging>" }
  ],
  "summary": "<1–2 sentence overall structural summary>"
}

Valid ids: ${ALL_BODY_PARTS.join(", ")}`;
}

export function workoutGenerationPrompt(opts: {
  metrics: UserMetrics;
  goal: GoalType;
  focusParts: BodyPartId[];
  minutes: number;
  dayContext: string;
}): string {
  return `You are Blueprint's training engine. Generate one session as structured JSON.

User:
- Experience: ${opts.metrics.experience}
- Equipment: ${opts.metrics.equipment}
- Injuries: ${opts.metrics.injuries?.join("; ") || "none"}
- Goal: ${opts.goal}
- Available minutes: ${opts.minutes}
- Focus body parts: ${opts.focusParts.map((p) => BODY_PART_LABELS[p]).join(", ")}
- Context: ${opts.dayContext}

Incorporate evidence-aligned popular approaches that match this build/goal (e.g. PPL volume for hypertrophy, full-body density for fat loss, low-rep compounds for strength) without naming brands flashily.

Return ONLY JSON:
{
  "title": string,
  "focusReason": string,
  "blocks": [
    {
      "name": string,
      "exercises": [
        {
          "name": string,
          "bodyParts": string[],
          "sets": number,
          "reps": string,
          "restSec": number,
          "cues": string[],
          "progressiveOverload": string
        }
      ]
    }
  ]
}`;
}

export function nutritionRationalePrompt(
  metrics: UserMetrics,
  phase: string,
  calories: number
): string {
  return `Explain in 2 calm sentences why ${calories} kcal (${phase}) suits a ${metrics.sex}, ${metrics.age}y, ${metrics.weightKg}kg, ${metrics.experience} trainee. No hype. Clinical tone.`;
}
