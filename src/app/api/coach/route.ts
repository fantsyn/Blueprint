import { NextResponse } from "next/server";
import { z } from "zod";
import { getXaiClient, DEFAULT_MODEL } from "@/lib/ai/client";
import type { CoachExtraction } from "@/types/journal";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .optional(),
  context: z
    .object({
      name: z.string().optional(),
      weightKg: z.number().optional(),
      goal: z.string().optional(),
      phase: z.string().optional(),
      calorieTarget: z.number().optional(),
      lagging: z.array(z.string()).optional(),
      recentWorkouts: z.array(z.string()).optional(),
    })
    .optional(),
});

function systemPrompt(context: z.infer<typeof bodySchema>["context"]) {
  return `You are Blueprint Coach — a calm, precise fitness assistant (Linear/Levels aesthetic, never gym-bro hype).

The user logs training, nutrition, weight, steps, preferences, and goals in natural language.

CONTEXT:
${JSON.stringify(context || {}, null, 0)}

Your job:
1) Reply briefly and clearly (2–5 sentences). Confirm what you logged.
2) Extract structured actions as JSON.

Respond with ONLY valid JSON (no markdown):
{
  "reply": "string shown to user",
  "actions": [
    // zero or more of:
    {
      "type": "workout",
      "date": "YYYY-MM-DD optional, default today",
      "title": "optional",
      "exercises": [
        { "name": "Bench Press", "sets": [{ "reps": 8, "weightKg": 80, "rpe": 7 }] }
      ],
      "durationMin": 55,
      "intensity": 7,
      "steps": 8000,
      "feeling": "liked" | "disliked" | "neutral",
      "notes": "optional"
    },
    {
      "type": "meal",
      "name": "Chicken rice bowl",
      "description": "optional details",
      "calories": 620,
      "proteinG": 45,
      "carbsG": 70,
      "fatG": 15
    },
    { "type": "weight", "weightKg": 78.5, "note": "optional" },
    { "type": "steps", "steps": 9500 },
    { "type": "goal", "newGoal": "recomposition|build_muscle|lose_fat|strength|athletic", "phase": "maintain|bulk|cut", "note": "optional" },
    { "type": "preference", "exerciseName": "Romanian Deadlift", "feeling": "liked|disliked|neutral", "note": "optional" },
    { "type": "none" }
  ]
}

Rules:
- Estimate meal macros reasonably if user doesn't specify numbers.
- Parse casual logs: "bench 3x8 @ 80kg", "hit 10k steps", "weigh 79.2", "hated lunges".
- If nothing to log, actions: [{ "type": "none" }] and still be helpful.
- Be clinical and encouraging, never flashy.`;
}

function localFallback(message: string): CoachExtraction {
  const lower = message.toLowerCase();
  const actions: CoachExtraction["actions"] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Weight: "weigh 79" / "weight 79.2"
  const w = lower.match(/(?:weigh(?:ed|s)?|weight|bw)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)/);
  if (w) {
    actions.push({ type: "weight", weightKg: Number(w[1]), date: today });
  }

  // Steps
  const steps = lower.match(/(\d{1,2}[\d,]{2,5})\s*steps/);
  if (steps) {
    actions.push({
      type: "steps",
      steps: Number(steps[1].replace(/,/g, "")),
      date: today,
    });
  }

  // Simple set pattern: "bench 3x8 @ 80"
  const setPat =
    /([a-z][a-z\s\-]{2,30}?)\s+(\d+)\s*[x×]\s*(\d+)(?:\s*@\s*(\d+(?:\.\d+)?)\s*kg?)?/gi;
  const exercises: {
    name: string;
    sets: { reps: number; weightKg?: number }[];
  }[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(setPat);
  while ((m = re.exec(message)) !== null) {
    const name = m[1].trim();
    const setsN = Number(m[2]);
    const reps = Number(m[3]);
    const weightKg = m[4] ? Number(m[4]) : undefined;
    const sets = Array.from({ length: Math.min(setsN, 10) }, () => ({
      reps,
      weightKg,
    }));
    exercises.push({ name: name.replace(/^(did|hit|logged)\s+/i, ""), sets });
  }
  if (exercises.length) {
    let feeling: "liked" | "disliked" | "neutral" | undefined;
    if (/hate|disliked|sucked|awful/.test(lower)) feeling = "disliked";
    if (/loved|liked|great|enjoyed/.test(lower)) feeling = "liked";
    actions.push({
      type: "workout",
      date: today,
      title: "Logged session",
      exercises,
      feeling,
    });
  }

  // Meal heuristic
  if (/\b(ate|eaten|meal|breakfast|lunch|dinner|snack)\b/.test(lower)) {
    actions.push({
      type: "meal",
      date: today,
      name: message.slice(0, 80),
      description: message,
    });
  }

  // Preference alone
  if (!exercises.length && /hate|dislike|love|like/.test(lower)) {
    const ex = lower.match(/(?:hate|dislike|love|like[d]?)\s+([a-z][a-z\s\-]{2,30})/);
    if (ex) {
      actions.push({
        type: "preference",
        exerciseName: ex[1].trim(),
        feeling: /hate|dislike/.test(lower) ? "disliked" : "liked",
      });
    }
  }

  if (!actions.length) {
    actions.push({ type: "none" });
  }

  const reply =
    actions[0].type === "none"
      ? "I can log workouts (e.g. bench 3x8 @ 80kg), meals, weight, steps, likes/dislikes, or goal changes. Try something specific."
      : `Logged ${actions.length} update${actions.length > 1 ? "s" : ""}. Check Workouts or Progress for history.`;

  return { reply, actions };
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, history, context } = parsed.data;
    const client = getXaiClient();

    if (!client) {
      const fallback = localFallback(message);
      return NextResponse.json({
        ok: true,
        extraction: fallback,
        source: "local",
      });
    }

    const messages = [
      { role: "system" as const, content: systemPrompt(context) },
      ...(history || []).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      const fallback = localFallback(message);
      return NextResponse.json({
        ok: true,
        extraction: fallback,
        source: "local",
      });
    }

    let extraction: CoachExtraction;
    try {
      extraction = JSON.parse(match[0]) as CoachExtraction;
    } catch {
      extraction = localFallback(message);
    }

    if (!extraction.reply) {
      extraction.reply = "Done — I updated your log.";
    }
    if (!extraction.actions?.length) {
      extraction.actions = [{ type: "none" }];
    }

    return NextResponse.json({
      ok: true,
      extraction,
      source: "ai",
    });
  } catch (err) {
    console.error("[coach]", err);
    return NextResponse.json(
      { error: "Coach unavailable", fallback: true },
      { status: 500 }
    );
  }
}
