import { NextResponse } from "next/server";
import { z } from "zod";
import { getXaiClient, DEFAULT_MODEL } from "@/lib/ai/client";
import { workoutGenerationPrompt } from "@/lib/ai/prompts";
import { generateSession } from "@/lib/workout-engine";
import type { BodyPartId, GoalType, UserMetrics } from "@/types";

const schema = z.object({
  metrics: z.object({
    age: z.number(),
    sex: z.enum(["male", "female", "other"]),
    heightCm: z.number(),
    weightKg: z.number(),
    bodyFatPct: z.number().optional(),
    experience: z.enum(["beginner", "intermediate", "advanced"]),
    equipment: z.enum([
      "full_gym",
      "home_dumbbells",
      "bodyweight",
      "minimal",
    ]),
    injuries: z.array(z.string()),
  }),
  goal: z.enum([
    "recomposition",
    "build_muscle",
    "lose_fat",
    "strength",
    "athletic",
  ]),
  focusParts: z.array(z.string()),
  minutes: z.number().default(55),
  scores: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        score: z.number(),
        status: z.enum(["lagging", "balanced", "strong"]),
        priority: z.number(),
        reason: z.string().optional(),
      })
    )
    .optional(),
  useAi: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { metrics, goal, focusParts, minutes, scores, useAi } = parsed.data;
    const date = new Date().toISOString().slice(0, 10);

    // Deterministic engine always available
    const local = generateSession({
      metrics: metrics as UserMetrics,
      scores: (scores as never) || [],
      goal: goal as GoalType,
      date,
      availableMinutes: minutes,
    });

    if (!useAi) {
      return NextResponse.json({ ok: true, session: local, source: "engine" });
    }

    const client = getXaiClient();
    if (!client) {
      return NextResponse.json({
        ok: true,
        session: local,
        source: "engine",
        note: "AI unavailable; used rule engine",
      });
    }

    const prompt = workoutGenerationPrompt({
      metrics: metrics as UserMetrics,
      goal: goal as GoalType,
      focusParts: focusParts as BodyPartId[],
      minutes,
      dayContext: local.focusReason,
    });

    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const text = response.choices[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ ok: true, session: local, source: "engine" });
    }

    const aiSession = JSON.parse(match[0]);
    return NextResponse.json({
      ok: true,
      session: {
        ...local,
        title: aiSession.title || local.title,
        focusReason: aiSession.focusReason || local.focusReason,
        blocks: aiSession.blocks || local.blocks,
      },
      source: "ai",
    });
  } catch (err) {
    console.error("[generate-session]", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
