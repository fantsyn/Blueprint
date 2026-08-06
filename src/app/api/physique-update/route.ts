import { NextResponse } from "next/server";
import { z } from "zod";
import { getXaiClient, VISION_MODEL } from "@/lib/ai/client";
import { ALL_BODY_PARTS, BODY_PART_LABELS, scoreToPriority, scoreToStatus } from "@/lib/body-parts";
import type { BodyPartId, BodyPartScore } from "@/types";

const schema = z.object({
  metrics: z
    .object({
      age: z.number().optional(),
      sex: z.string().optional(),
      weightKg: z.number().optional(),
      heightCm: z.number().optional(),
      experience: z.string().optional(),
    })
    .optional(),
  previousScores: z
    .array(
      z.object({
        id: z.string(),
        score: z.number(),
      })
    )
    .optional(),
  photos: z
    .object({
      front: z.string().optional(),
      side: z.string().optional(),
      back: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

function heuristicUpdate(
  previous?: { id: string; score: number }[],
  notes?: string
): {
  scores: BodyPartScore[];
  summary: string;
  workoutAdjustments: string[];
  nutritionNotes: string[];
  whatsWorking: string[];
  needsChange: string[];
} {
  const prevMap = new Map((previous || []).map((p) => [p.id, p.score]));
  const note = (notes || "").toLowerCase();

  const scores: BodyPartScore[] = ALL_BODY_PARTS.map((id) => {
    let score = prevMap.get(id) ?? 52;
    // Small random walk for demo when no vision
    score += Math.round((Math.random() - 0.45) * 4);
    if (notes) {
      if (note.includes("shoulder") && id === "shoulders") score += 3;
      if (note.includes("back") && (id === "lats" || id === "mid_back"))
        score += 3;
      if (note.includes("leg") && (id === "quads" || id === "hamstrings"))
        score += 2;
      if (note.includes("fat") || note.includes("cut")) {
        if (id === "abs" || id === "obliques") score += 2;
      }
    }
    score = Math.max(25, Math.min(90, score));
    return {
      id,
      label: BODY_PART_LABELS[id],
      score,
      status: scoreToStatus(score),
      priority: scoreToPriority(score),
      reason:
        score < 48
          ? `${BODY_PART_LABELS[id]} still relative lag — keep priority volume`
          : undefined,
    };
  });

  const lagging = scores
    .filter((s) => s.status === "lagging")
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const improved = scores
    .map((s) => ({
      s,
      d: s.score - (prevMap.get(s.id) ?? s.score),
    }))
    .filter((x) => x.d > 1)
    .sort((a, b) => b.d - a.d);

  return {
    scores,
    summary:
      lagging.length > 0
        ? `Updated hologram. Priority remains ${lagging.map((l) => l.label).join(", ")}.`
        : "Updated hologram. Development looks more balanced.",
    workoutAdjustments: lagging.map(
      (l) => `Add 1–2 weekly sets for ${l.label}; bias session openers here.`
    ),
    nutritionNotes: [
      "Hold protein high (~2g/kg) while assessing the new physique snapshot.",
      "If waist is trending up without strength gains, tighten surplus.",
    ],
    whatsWorking: improved.length
      ? improved
          .slice(0, 3)
          .map((x) => `${x.s.label} +${x.d} relative score`)
      : ["Consistency signals — keep logging sessions for clearer trends"],
    needsChange: lagging.map(
      (l) => `${l.label} still underscored — progressive overload priority`
    ),
  };
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { metrics, previousScores, photos, notes } = parsed.data;
    const client = getXaiClient();
    const photoEntries = Object.entries(photos || {}).filter(([, v]) => v);

    if (!client || photoEntries.length === 0) {
      const result = heuristicUpdate(previousScores, notes);
      return NextResponse.json({
        ok: true,
        source: photoEntries.length ? "heuristic" : "heuristic-no-photo",
        ...result,
      });
    }

    const prompt = `You are Blueprint's physique analyst. Compare new guided photos to prior relative scores and produce an updated development map.

Metrics: ${JSON.stringify(metrics || {})}
Previous scores: ${JSON.stringify(previousScores || [])}
User notes: ${notes || "none"}

Body parts: ${ALL_BODY_PARTS.join(", ")}

Return ONLY JSON:
{
  "scores": [{ "id": "lats", "score": 42, "reason": "optional if lagging" }],
  "summary": "1-2 calm sentences",
  "workoutAdjustments": ["string", "..."],
  "nutritionNotes": ["string", "..."],
  "whatsWorking": ["string", "..."],
  "needsChange": ["string", "..."]
}

Rules: scores 0-100 relative within this physique; lagging ~30-45, strong ~70-85. Clinical tone.`;

    const response = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...photoEntries.map(([, url]) => ({
              type: "image_url" as const,
              image_url: { url: url as string },
            })),
          ],
        },
      ],
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      const result = heuristicUpdate(previousScores, notes);
      return NextResponse.json({ ok: true, source: "heuristic", ...result });
    }

    const data = JSON.parse(match[0]);
    const scores: BodyPartScore[] = (data.scores || []).map(
      (s: { id: string; score: number; reason?: string }) => {
        const id = s.id as BodyPartId;
        return {
          id,
          label: BODY_PART_LABELS[id] || s.id,
          score: Math.round(Number(s.score)),
          status: scoreToStatus(Number(s.score)),
          priority: scoreToPriority(Number(s.score)),
          reason: s.reason,
        };
      }
    );

    // Fill missing parts from previous/heuristic
    for (const id of ALL_BODY_PARTS) {
      if (!scores.find((s) => s.id === id)) {
        const prev = previousScores?.find((p) => p.id === id);
        const score = prev?.score ?? 50;
        scores.push({
          id,
          label: BODY_PART_LABELS[id],
          score,
          status: scoreToStatus(score),
          priority: scoreToPriority(score),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      source: "ai",
      scores,
      summary: data.summary || "Physique map updated.",
      workoutAdjustments: data.workoutAdjustments || [],
      nutritionNotes: data.nutritionNotes || [],
      whatsWorking: data.whatsWorking || [],
      needsChange: data.needsChange || [],
    });
  } catch (err) {
    console.error("[physique-update]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
