import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/utils";
import type { RecoveryIndicator, UserMetrics } from "@/types";
import { Activity, Scale, Ruler, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsStripProps {
  metrics: UserMetrics;
  recovery: RecoveryIndicator;
}

export function MetricsStrip({ metrics, recovery }: MetricsStripProps) {
  const recoveryColor =
    recovery.label === "high"
      ? "text-[var(--status-recovery-high)]"
      : recovery.label === "low"
        ? "text-[var(--status-recovery-low)]"
        : "text-[var(--status-recovery-mod)]";

  const items = [
    {
      icon: Scale,
      label: "Weight",
      value: formatNumber(metrics.weightKg, 1),
      unit: "kg",
    },
    {
      icon: Ruler,
      label: "Height",
      value: formatNumber(metrics.heightCm, 0),
      unit: "cm",
    },
    {
      icon: Activity,
      label: "Body fat",
      value:
        metrics.bodyFatPct != null ? formatNumber(metrics.bodyFatPct, 1) : "—",
      unit: metrics.bodyFatPct != null ? "%" : "",
    },
    {
      icon: HeartPulse,
      label: "Recovery",
      value: formatNumber(recovery.score, 0),
      unit: "",
      accent: recoveryColor,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map(({ icon: Icon, label, value, unit, accent }) => (
        <Card key={label} padding="none" className="!p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Icon className="h-3 w-3 text-steel-muted" strokeWidth={1.75} />
            <span className="eyebrow !text-[9px] !tracking-[0.12em]">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-num text-[1.25rem] tracking-tight leading-none",
                accent || "text-primary"
              )}
            >
              {value}
            </span>
            {unit && (
              <span className="text-[10px] text-muted font-medium">{unit}</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
