"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useHydratedProfile } from "@/hooks/useHydratedProfile";
import { useJournalStore } from "@/store/useJournalStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ManualLogSheet, type LogKind } from "@/components/log/ManualLogSheet";
import {
  Send,
  Dumbbell,
  Utensils,
  Scale,
  Footprints,
  Heart,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachExtraction } from "@/types/journal";
import Link from "next/link";

const QUICK: { label: string; text: string }[] = [
  { label: "Sets", text: "Bench press 4x6 @ 90kg, felt solid RPE 8" },
  { label: "Meal", text: "Lunch was chicken rice bowl with avocado" },
  { label: "Weight", text: "Weighed in at 78.4 kg this morning" },
  { label: "Steps", text: "Hit 10200 steps today" },
  { label: "Dislike", text: "I really dislike walking lunges" },
];

const MANUAL: { kind: LogKind; label: string; icon: typeof Dumbbell }[] = [
  { kind: "workout", label: "Workout", icon: Dumbbell },
  { kind: "meal", label: "Meal", icon: Utensils },
  { kind: "weight", label: "Weight", icon: Scale },
  { kind: "steps", label: "Steps", icon: Footprints },
  { kind: "preference", label: "Like", icon: Heart },
  { kind: "goal", label: "Goal", icon: Target },
];

export default function CoachPage() {
  const { ready, profile, agenda } = useHydratedProfile();
  const journal = useJournalStore((s) => s.journal);
  const appendChat = useJournalStore((s) => s.appendChat);
  const applyExtraction = useJournalStore((s) => s.applyExtraction);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sheet, setSheet] = useState<LogKind | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [journal.chat.length, sending]);

  if (!ready || !profile) {
    return <LoadingScreen />;
  }

  const lagging = profile.bodyPartScores
    .filter((s) => s.status === "lagging")
    .slice(0, 3)
    .map((s) => s.label);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    appendChat({ role: "user", content: message });

    try {
      const history = journal.chat
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history,
          context: {
            name: profile.name,
            weightKg: profile.metrics.weightKg,
            goal: profile.goal.type,
            phase: agenda?.nutrition.phase,
            calorieTarget: agenda?.nutrition.active.calories,
            lagging,
            recentWorkouts: journal.workouts
              .slice(0, 5)
              .map((w) => `${w.date}: ${w.title || "session"}`),
          },
        }),
      });

      const data = await res.json();
      const extraction = (data.extraction || {
        reply: "Could not parse that — try a clearer log.",
        actions: [{ type: "none" }],
      }) as CoachExtraction;

      const applied = applyExtraction(extraction);
      appendChat({
        role: "assistant",
        content: extraction.reply,
        applied: applied?.length ? applied : undefined,
      });
    } catch {
      appendChat({
        role: "assistant",
        content:
          "Something went wrong reaching the coach. Use the manual buttons below.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Logging"
        title="Coach"
        description="Speak naturally — workouts, meals, weight, steps, preferences. Or use quick manual entry."
        action={
          <Link href="/update">
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Physique
            </Button>
          </Link>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1 scrollbar-none">
        {MANUAL.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => setSheet(kind)}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-border bg-elevated/80 px-3.5 py-2 text-[12px] text-secondary hover:border-cyan/30 hover:text-cyan hover:bg-cyan-soft transition-all duration-200"
          >
            <Icon className="h-3 w-3 opacity-80" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      <div className="glass-elevated rounded-[var(--radius-xl)] flex flex-col min-h-[54dvh] max-h-[64dvh] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {journal.chat.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-14 px-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-elevated">
                <Sparkles className="h-5 w-5 text-cyan/70" strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-medium text-primary mb-1.5">
                Tell me what you did
              </p>
              <p className="text-[12px] text-tertiary max-w-[280px] leading-relaxed">
                e.g. “Squat 5×5 @ 120kg, hated leg press, salmon and rice, 9k
                steps, weight 79.1”
              </p>
            </div>
          )}
          {journal.chat.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col max-w-[88%] sm:max-w-[80%]",
                m.role === "user" ? "ml-auto items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed",
                  m.role === "user"
                    ? "bg-cyan/12 text-primary border border-cyan/25 rounded-br-md"
                    : "bg-elevated/90 text-secondary border border-border-subtle rounded-bl-md"
                )}
              >
                {m.content}
              </div>
              {m.applied && m.applied.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 justify-end">
                  {m.applied.map((a, i) => (
                    <Badge key={i} variant="cyan">
                      {a.summary}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="text-[12px] text-muted flex items-center gap-2 pl-1">
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-cyan/40 border-t-cyan" />
              Logging…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 sm:px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => void send(q.text)}
              className="shrink-0 rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-tertiary hover:text-cyan hover:border-cyan/25 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        <form
          className="border-t border-border-subtle p-3 sm:p-3.5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Log a workout, meal, weight…"
            className="flex-1 h-11 rounded-[var(--radius-md)] bg-inset border border-border px-3.5 text-[13px] text-primary placeholder:text-muted focus:outline-none focus:border-cyan/40 focus:ring-2 focus:ring-cyan/15 transition-all"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim()}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-[11px] text-muted">
        History in{" "}
        <Link href="/workouts" className="text-cyan/90 hover:text-cyan transition-colors">
          Workouts
        </Link>
        {" · "}
        trends in{" "}
        <Link href="/progress" className="text-cyan/90 hover:text-cyan transition-colors">
          Progress
        </Link>
      </p>

      <ManualLogSheet
        open={sheet != null}
        kind={sheet || "workout"}
        onClose={() => setSheet(null)}
      />
    </AppShell>
  );
}
