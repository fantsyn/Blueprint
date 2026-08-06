"use client";

import { AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BodySilhouette } from "@/components/blueprint/BodySilhouette";
import { BodyPartPanel } from "@/components/blueprint/BodyPartPanel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useJournalStore } from "@/store/useJournalStore";
import { deltasFromPhysiqueUpdates } from "@/lib/body-deltas";
import { useMemo } from "react";

export default function BlueprintPage() {
  const { ready, profile, agenda } = useHydratedProfile();
  const selectedBodyPart = useAppStore((s) => s.selectedBodyPart);
  const setSelectedBodyPart = useAppStore((s) => s.setSelectedBodyPart);
  const physiqueUpdates = useJournalStore((s) => s.journal.physiqueUpdates);
  const deltas = useMemo(
    () => deltasFromPhysiqueUpdates(physiqueUpdates),
    [physiqueUpdates]
  );

  if (!ready || !profile) {
    return <LoadingScreen />;
  }

  const sorted = [...profile.bodyPartScores].sort((a, b) => a.score - b.score);
  const lagging = sorted.filter((s) => s.status === "lagging");
  const strong = sorted.filter((s) => s.status === "strong");
  const selectedScore = profile.bodyPartScores.find(
    (s) => s.id === selectedBodyPart
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Structure"
        title="Your blueprint"
        description="Relative development map. Tap any region for prescription detail."
      />

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <BodySilhouette
              scores={profile.bodyPartScores}
              focusParts={agenda?.priorityParts || []}
              selectedPart={selectedBodyPart}
              deltas={deltas}
              onSelectPart={(id) =>
                setSelectedBodyPart(selectedBodyPart === id ? null : id)
              }
            />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {selectedBodyPart ? (
              <BodyPartPanel
                key={selectedBodyPart}
                partId={selectedBodyPart}
                score={selectedScore}
                profile={profile}
                delta={deltas?.[selectedBodyPart]}
                onClose={() => setSelectedBodyPart(null)}
              />
            ) : (
              <>
                <Card key="summary">
                  <CardHeader>
                    <div>
                      <CardTitle>Development overview</CardTitle>
                      <CardDescription>
                        Ranked by priority · lower score = more focus
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="cyan">{lagging.length} lagging</Badge>
                      <Badge variant="muted">{strong.length} strong</Badge>
                    </div>
                  </CardHeader>

                  <div className="space-y-3">
                    {sorted.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedBodyPart(s.id)}
                        className={cn(
                          "w-full text-left rounded-[var(--radius-md)] p-3 transition-colors",
                          "hover:bg-hover border border-transparent hover:border-border-subtle",
                          selectedBodyPart === s.id && "bg-cyan-soft border-cyan/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-primary font-medium">
                              {s.label}
                            </span>
                            <Badge
                              variant={
                                s.status === "lagging"
                                  ? "cyan"
                                  : s.status === "strong"
                                    ? "muted"
                                    : "steel"
                              }
                            >
                              {s.status}
                            </Badge>
                          </div>
                          <span className="font-num text-sm text-secondary">
                            {s.score}
                          </span>
                        </div>
                        <Progress
                          value={s.score}
                          barClassName={
                            s.status === "lagging"
                              ? "bg-cyan/70"
                              : s.status === "strong"
                                ? "bg-steel-muted"
                                : "bg-steel/50"
                          }
                        />
                        {s.reason && (
                          <p className="mt-1.5 text-xs text-tertiary line-clamp-2">
                            {s.reason}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
