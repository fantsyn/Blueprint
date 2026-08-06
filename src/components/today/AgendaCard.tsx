import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { WorkoutSession } from "@/types";
import { BODY_PART_LABELS } from "@/lib/body-parts";
import { Clock, ChevronRight, Moon } from "lucide-react";

interface AgendaCardProps {
  session: WorkoutSession | null;
  isRestDay?: boolean;
  restNote?: string;
}

export function AgendaCard({ session, isRestDay, restNote }: AgendaCardProps) {
  if (isRestDay || !session) {
    return (
      <Card elevated>
        <CardHeader>
          <div>
            <CardTitle className="!text-base">Rest day</CardTitle>
            <CardDescription>
              {restNote || "Recovery is part of the blueprint."}
            </CardDescription>
          </div>
          <Badge variant="steel">
            <Moon className="h-3 w-3" />
            Rest
          </Badge>
        </CardHeader>
      </Card>
    );
  }

  const totalExercises = session.blocks.reduce(
    (n, b) => n + b.exercises.length,
    0
  );

  return (
    <Card elevated>
      <CardHeader>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <CardTitle className="!text-base">{session.title}</CardTitle>
            <Badge variant="cyan">Today</Badge>
          </div>
          <CardDescription className="flex items-center gap-3 !mt-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 opacity-70" />
              <span className="font-num">~{session.estimatedMinutes}m</span>
            </span>
            <span className="font-num">{totalExercises} exercises</span>
          </CardDescription>
        </div>
      </CardHeader>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {session.focusParts.map((id) => (
          <Badge key={id} variant="steel">
            {BODY_PART_LABELS[id]}
          </Badge>
        ))}
      </div>

      <div className="space-y-4 mb-5">
        {session.blocks.map((block) => (
          <div key={block.name}>
            <p className="eyebrow mb-2.5">{block.name}</p>
            <ul className="space-y-0">
              {block.exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between gap-3 text-[13px] py-2.5 border-b border-border-subtle last:border-0"
                >
                  <span className="text-secondary truncate">{ex.name}</span>
                  <span className="font-num text-[11px] text-cyan shrink-0 tabular-nums">
                    {ex.sets}×{ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link href={`/workout/${session.id}`} className="block">
        <Button className="w-full" size="lg">
          Start session
          <ChevronRight className="h-4 w-4 opacity-80" />
        </Button>
      </Link>
    </Card>
  );
}
