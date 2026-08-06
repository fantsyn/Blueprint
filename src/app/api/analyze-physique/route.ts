import { NextResponse } from "next/server";
import { z } from "zod";
import { getXaiClient, VISION_MODEL } from "@/lib/ai/client";
import { physiqueAnalysisPrompt } from "@/lib/ai/prompts";
import type { UserMetrics } from "@/types";

const bodySchema = z.object({
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
  /** data URLs or public image URLs for front/side/back */
  photos: z
    .object({
      front: z.string().optional(),
      side: z.string().optional(),
      back: z.string().optional(),
    })
    .optional(),
});

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

    const client = getXaiClient();
    if (!client) {
      return NextResponse.json(
        {
          error: "XAI_API_KEY not configured",
          fallback: true,
          message:
            "Vision analysis unavailable. Client will use heuristic scoring.",
        },
        { status: 503 }
      );
    }

    const metrics = parsed.data.metrics as UserMetrics;
    const photos = parsed.data.photos || {};
    const prompt = physiqueAnalysisPrompt(metrics);

    const imageContent = Object.entries(photos)
      .filter(([, url]) => url)
      .map(([, url]) => ({
        type: "image_url" as const,
        image_url: { url: url as string },
      }));

    const response = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageContent,
          ],
        },
      ],
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || "{}";
    // Extract JSON block if wrapped in markdown
    const match = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(match?.[0] || text);

    return NextResponse.json({ ok: true, analysis: data });
  } catch (err) {
    console.error("[analyze-physique]", err);
    return NextResponse.json(
      { error: "Analysis failed", fallback: true },
      { status: 500 }
    );
  }
}
