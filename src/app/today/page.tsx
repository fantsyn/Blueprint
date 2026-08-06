"use client";

import { AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BodySilhouette } from "@/components/blueprint/BodySilhouette";
import { BodyPartPanel } from "@/components/blueprint/BodyPartPanel";
import { MetricsStrip } from "@/components/today/MetricsStrip";
import { AgendaCard } from "@/components/today/AgendaCard";
import { NutritionSnapshot } from "@/components/today/NutritionSnapshot";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BODY_PART_LABELS } from "@/lib/body-parts";
import { format } from "date-fns";
import Link from "next/link";
import { MessageSquare, CalendarDays } from "lucide-react";
import { useJournalStore } from "@/store/useJournalStore";
import { dailyMealTotals } from "@/lib/journal/insights";
import { deltasFromPhysiqueUpdates } from "@/lib/body-deltas";
import { useMemo } from "react";

export default function TodayPage() {
  const { ready, profile, agenda } = useHydratedProfile();
  const selectedBodyPart = useAppStore((s) => s.selectedBodyPart);
  const setSelectedBodyPart = useAppStore((s) => s.setSelectedBodyPart);
  const journal = useJournalStore((s) => s.journal);
  const deltas = useMemo(
    () => deltasFromPhysiqueUpdates(journal.physiqueUpdates),
    [journal.physiqueUpdates]
  );
  const todayKey = new Date().toISOString().slice(0, 10);
  const mealsToday = dailyMealTotals(journal, todayKey);
  const sessionsToday = journal.workouts.filter((w) => w.date === todayKey)
    .length;

  if (!ready || !profile || !agenda) {
    return <LoadingScreen />;
  }

  const priorityLabels = agenda.priorityParts
    .slice(0, 3)
    .map((id) => BODY_PART_LABELS[id])
    .join(" · ");

  const selectedScore = profile.bodyPartScores.find(
    (s) => s.id === selectedBodyPart
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow={format(new Date(agenda.date), "EEEE · d MMMM")}
        title={`Today, ${profile.name}`}
        description="Your priority map, session, and nutrition for the day."
      />

      <Card elevated className="mb-4 !py-5">
        <p className="eyebrow mb-2">Today&apos;s priority</p>
        <p className="display text-lg sm:text-xl text-primary">
          {priorityLabels || "Balanced full-body"}
        </p>
        <p className="mt-2 text-[13px] text-secondary leading-relaxed max-w-2xl">
          {agenda.priorityReason}
        </p>
      </Card>

      <div className="flex gap-2 mb-4">
        <Link href="/coach" className="flex-1">
          <Button variant="primary" size="md" className="w-full">
            <MessageSquare className="h-3.5 w-3.5" />
            Log with Coach
          </Button>
        </Link>
        <Link href="/workouts" className="flex-1">
          <Button variant="secondary" size="md" className="w-full">
            <CalendarDays className="h-3.5 w-3.5" />
            History
            {sessionsToday > 0 ? (
              <span className="font-num text-cyan">· {sessionsToday}</span>
            ) : null}
          </Button>
        </Link>
      </div>

      {(mealsToday.calories > 0 || sessionsToday > 0) && (
        <Card padding="none" className="mb-6 !px-4 !py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Logged today</p>
            <p className="text-[13px] text-secondary">
              {sessionsToday > 0 && (
                <>
                  <span className="font-num text-cyan">{sessionsToday}</span>
                  {" session"}
                  {sessionsToday > 1 ? "s" : ""}
                </>
              )}
              {sessionsToday > 0 && mealsToday.calories > 0 && (
                <span className="text-muted mx-1.5">·</span>
              )}
              {mealsToday.calories > 0 && (
                <>
                  <span className="font-num text-cyan">
                    {mealsToday.calories}
                  </span>
                  {" kcal"}
                  <span className="text-muted"> · </span>
                  <span className="font-num">P{mealsToday.proteinG}</span>
                </>
              )}
            </p>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <BodySilhouette
            scores={profile.bodyPartScores}
            focusParts={agenda.priorityParts}
            selectedPart={selectedBodyPart}
            deltas={deltas}
            onSelectPart={(id) =>
              setSelectedBodyPart(selectedBodyPart === id ? null : id)
            }
          />
        </div>

        <div className="space-y-4">
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
              <div key="agenda" className="space-y-4">
                <MetricsStrip
                  metrics={profile.metrics}
                  recovery={agenda.recovery}
                />
                <AgendaCard
                  session={agenda.session}
                  isRestDay={agenda.isRestDay}
                  restNote={agenda.restNote}
                />
                <NutritionSnapshot
                  active={agenda.nutrition.active}
                  phase={agenda.nutrition.phase}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
