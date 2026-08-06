import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { MacroTargets, NutritionPhase } from "@/types";
import { formatNumber } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface NutritionSnapshotProps {
  active: MacroTargets;
  phase: NutritionPhase;
}

const PHASE_LABEL: Record<NutritionPhase, string> = {
  maintain: "Maintain",
  bulk: "Build",
  cut: "Cut",
};

export function NutritionSnapshot({ active, phase }: NutritionSnapshotProps) {
  const macros = [
    {
      label: "Protein",
      value: active.proteinG,
      unit: "g",
      color: "bg-cyan/70",
      width: "70%",
    },
    {
      label: "Carbs",
      value: active.carbsG,
      unit: "g",
      color: "bg-steel/45",
      width: "55%",
    },
    {
      label: "Fat",
      value: active.fatG,
      unit: "g",
      color: "bg-steel-muted/55",
      width: "40%",
    },
  ];

  return (
    <Link href="/nutrition" className="block group">
      <Card className="transition-all duration-200 group-hover:border-border-strong">
        <CardHeader className="mb-3">
          <div>
            <CardTitle>Nutrition</CardTitle>
            <CardDescription>
              {PHASE_LABEL[phase]} phase · daily targets
            </CardDescription>
          </div>
          <ChevronRight className="h-4 w-4 text-muted group-hover:text-secondary transition-colors shrink-0" />
        </CardHeader>

        <div className="flex items-baseline gap-1.5 mb-5">
          <span className="font-num text-[1.75rem] text-primary tracking-tight leading-none">
            {formatNumber(active.calories)}
          </span>
          <span className="text-[11px] text-muted font-medium">kcal</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {macros.map((m) => (
            <div key={m.label}>
              <div className="h-1 rounded-full bg-inset mb-2 overflow-hidden border border-border-subtle/40">
                <div
                  className={`h-full rounded-full ${m.color}`}
                  style={{ width: m.width }}
                />
              </div>
              <p className="eyebrow !text-[9px] mb-0.5">{m.label}</p>
              <p className="font-num text-[13px] text-secondary">
                {m.value}
                <span className="text-muted text-[10px] ml-0.5">{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}
