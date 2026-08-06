"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { useJournalStore } from "@/store/useJournalStore";
import { PhotoUploadSlot } from "@/components/onboarding/PhotoUploadSlot";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BodySilhouette } from "@/components/blueprint/BodySilhouette";
import type { BodyPartScore, PhotoPose } from "@/types";
import { Sparkles } from "lucide-react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function UpdatePage() {
  const router = useRouter();
  const { ready, profile, agenda } = useHydratedProfile();
  const applyPhysiqueUpdate = useJournalStore((s) => s.applyPhysiqueUpdate);
  const journal = useJournalStore((s) => s.journal);

  const [photos, setPhotos] = useState<Partial<Record<PhotoPose, string>>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    scores: BodyPartScore[];
    summary: string;
    workoutAdjustments: string[];
    nutritionNotes: string[];
    whatsWorking: string[];
    needsChange: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready || !profile) {
    return <LoadingScreen />;
  }

  const runUpdate = async () => {
    setBusy(true);
    setError(null);
    try {
      // Compress already done in PhotoUploadSlot — still trim payload size
      const res = await fetch("/api/physique-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            age: profile.metrics.age,
            sex: profile.metrics.sex,
            weightKg: profile.metrics.weightKg,
            heightCm: profile.metrics.heightCm,
            experience: profile.metrics.experience,
          },
          previousScores: profile.bodyPartScores.map((s) => ({
            id: s.id,
            score: s.score,
          })),
          photos,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }

      const payload = {
        scores: data.scores as BodyPartScore[],
        summary: data.summary as string,
        workoutAdjustments: (data.workoutAdjustments || []) as string[],
        nutritionNotes: (data.nutritionNotes || []) as string[],
        whatsWorking: (data.whatsWorking || []) as string[],
        needsChange: (data.needsChange || []) as string[],
      };
      setResult(payload);

      applyPhysiqueUpdate({
        date: new Date().toISOString().slice(0, 10),
        poses: Object.keys(photos) as PhotoPose[],
        hadPhotos: Object.keys(photos).length > 0,
        scores: payload.scores,
        previousScores: profile.bodyPartScores,
        summary: payload.summary,
        workoutAdjustments: payload.workoutAdjustments,
        nutritionNotes: payload.nutritionNotes,
        whatsWorking: payload.whatsWorking,
        needsChange: payload.needsChange,
      });
    } catch {
      setError("Could not reach analysis. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const displayScores = result?.scores || profile.bodyPartScores;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Recalibrate"
        title="Physique update"
        description="Upload new captures to refresh the hologram, re-rank priorities, and adjust training and nutrition notes."
      />

      {!result ? (
        <div className="space-y-5 max-w-lg">
          <div className="grid grid-cols-3 gap-2.5">
            {(["front", "side", "back"] as PhotoPose[]).map((pose) => (
              <PhotoUploadSlot
                key={pose}
                pose={pose}
                value={photos[pose]}
                onChange={(url) =>
                  setPhotos((p) => ({ ...p, [pose]: url }))
                }
              />
            ))}
          </div>
          <Input
            label="Notes (optional)"
            placeholder="e.g. shoulders look fuller, waist down"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-[11px] text-muted">
            Photos are analyzed then discarded from storage (scores kept). You
            can also run with notes only for a heuristic refresh.
          </p>
          {error && <p className="text-sm text-[#c47a6a]">{error}</p>}
          <Button
            size="lg"
            className="w-full"
            loading={busy}
            onClick={() => void runUpdate()}
          >
            <Sparkles className="h-4 w-4" />
            Update hologram
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <BodySilhouette
            scores={displayScores}
            focusParts={agenda?.priorityParts || []}
          />
          <div className="space-y-4">
            <Card elevated>
              <CardHeader>
                <div>
                  <CardTitle>Analysis</CardTitle>
                  <CardDescription>What changed</CardDescription>
                </div>
              </CardHeader>
              <p className="text-sm text-secondary leading-relaxed">
                {result.summary}
              </p>
            </Card>

            <Card>
              <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
                What&apos;s working
              </p>
              <ul className="space-y-1.5">
                {result.whatsWorking.map((t) => (
                  <li key={t} className="text-sm text-secondary flex gap-2">
                    <Badge variant="cyan">+</Badge>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
                Needs change
              </p>
              <ul className="space-y-1.5">
                {result.needsChange.map((t) => (
                  <li key={t} className="text-sm text-secondary flex gap-2">
                    <Badge variant="warning">!</Badge>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
                Workout adjustments
              </p>
              <ul className="space-y-1.5 text-sm text-secondary">
                {result.workoutAdjustments.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </Card>

            <Card>
              <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
                Nutrition notes
              </p>
              <ul className="space-y-1.5 text-sm text-secondary">
                {result.nutritionNotes.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setResult(null);
                  setPhotos({});
                }}
              >
                New update
              </Button>
              <Button className="flex-1" onClick={() => router.push("/today")}>
                View today
              </Button>
            </div>
          </div>
        </div>
      )}

      {journal.physiqueUpdates.length > 0 && !result && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-primary mb-3">
            Past updates
          </h2>
          <div className="space-y-2">
            {journal.physiqueUpdates.slice(0, 5).map((u) => (
              <Card key={u.id} padding="sm">
                <div className="flex justify-between gap-2">
                  <p className="text-sm text-secondary line-clamp-2">
                    {u.summary}
                  </p>
                  <span className="font-num text-[11px] text-muted shrink-0">
                    {u.date}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
