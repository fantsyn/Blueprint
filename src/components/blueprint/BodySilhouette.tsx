"use client";

import { useId, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BodyPartId, BodyPartScore } from "@/types";
import { BODY_PART_LABELS } from "@/lib/body-parts";
import { cn } from "@/lib/utils";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  OUTER_SILHOUETTE,
  HEAD_PATH,
  NECK_PATH,
  FRONT_REGIONS,
  BACK_REGIONS,
} from "./anatomy-paths";

type ViewSide = "front" | "back";

export interface BodySilhouetteProps {
  scores: BodyPartScore[];
  focusParts?: BodyPartId[];
  selectedPart?: BodyPartId | null;
  onSelectPart?: (id: BodyPartId) => void;
  /** Optional score deltas (e.g. from last physique update) */
  deltas?: Partial<Record<BodyPartId, number>>;
  className?: string;
  showLegend?: boolean;
  compact?: boolean;
  /** Dim non-focus regions when focusParts provided */
  dimNonFocus?: boolean;
}

function scoreMap(scores: BodyPartScore[]): Map<BodyPartId, BodyPartScore> {
  return new Map(scores.map((s) => [s.id, s]));
}

/** Continuous score → fill/stroke (lagging = cyan, strong = quiet steel) */
function scoreVisual(
  score: number | undefined,
  opts: {
    isFocus: boolean;
    isActive: boolean;
    dimmed: boolean;
  }
): {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  glow: boolean;
} {
  const s = score ?? 50;
  // Map 25–90 → cool steel (strong) to cyan (lagging)
  // Invert: low score = more cyan
  const lag = Math.max(0, Math.min(1, (65 - s) / 40)); // 0 strong → 1 lagging
  const cyan = 94;
  const cG = 200;
  const cB = 192;
  const steel = 120;

  const r = Math.round(steel + (cyan - steel) * lag * 0.15);
  const g = Math.round(steel + (cG - steel) * lag);
  const b = Math.round(steel + (cB - steel) * lag);

  let fillA = 0.06 + lag * 0.14 + (opts.isFocus ? 0.04 : 0);
  let strokeA = 0.28 + lag * 0.4 + (opts.isFocus ? 0.12 : 0);
  let strokeWidth = 1 + lag * 0.5 + (opts.isFocus ? 0.2 : 0);
  let opacity = opts.dimmed ? 0.28 : 1;
  let glow = lag > 0.45 || opts.isFocus;

  if (opts.isActive) {
    fillA = Math.min(0.38, fillA + 0.14);
    strokeA = Math.min(0.95, strokeA + 0.25);
    strokeWidth = Math.max(strokeWidth, 1.75);
    glow = true;
    opacity = 1;
  }

  return {
    fill: `rgba(${r}, ${g}, ${b}, ${fillA.toFixed(3)})`,
    stroke: `rgba(${r}, ${Math.min(220, g + 10)}, ${Math.min(210, b + 8)}, ${strokeA.toFixed(3)})`,
    strokeWidth,
    opacity,
    glow,
  };
}

function AnatomyFigure({
  side,
  map,
  focusParts,
  selected,
  hovered,
  onHover,
  onSelect,
  dimNonFocus,
  filterPrefix,
}: {
  side: ViewSide;
  map: Map<BodyPartId, BodyPartScore>;
  focusParts: BodyPartId[];
  selected?: BodyPartId | null;
  hovered: BodyPartId | null;
  onHover: (id: BodyPartId | null) => void;
  onSelect: (id: BodyPartId) => void;
  dimNonFocus: boolean;
  filterPrefix: string;
}) {
  const regions = side === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const hasFocus = focusParts.length > 0 && dimNonFocus;

  const makeHandlers = (id: BodyPartId) => ({
    onMouseEnter: () => onHover(id),
    onMouseLeave: () => onHover(null),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(id);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(id);
      }
    },
  });

  return (
    <g>
      {/* Plate fill */}
      <path
        d={OUTER_SILHOUETTE}
        fill="url(#plate-fill)"
        stroke="rgba(139,146,156,0.18)"
        strokeWidth={0.75}
        pointerEvents="none"
      />

      {/* Subtle center construction line */}
      <line
        x1={100}
        y1={72}
        x2={100}
        y2={450}
        stroke="rgba(139,146,156,0.06)"
        strokeWidth={0.5}
        strokeDasharray="3 5"
        pointerEvents="none"
      />

      {/* Head + neck — non-interactive structure */}
      <path
        d={HEAD_PATH}
        fill="rgba(139,146,156,0.05)"
        stroke="rgba(139,146,156,0.28)"
        strokeWidth={0.9}
        pointerEvents="none"
      />
      <path
        d={NECK_PATH}
        fill="rgba(139,146,156,0.04)"
        stroke="rgba(139,146,156,0.18)"
        strokeWidth={0.6}
        pointerEvents="none"
      />

      {/* Interactive muscle regions */}
      {regions.map((region, i) => {
        const score = map.get(region.id);
        const isFocus = focusParts.includes(region.id);
        const isActive = selected === region.id || hovered === region.id;
        const dimmed = hasFocus && !isFocus && !isActive;
        const v = scoreVisual(score?.score, {
          isFocus,
          isActive,
          dimmed,
        });

        return (
          <path
            key={`${region.id}-${region.side ?? "C"}-${i}`}
            d={region.d}
            fill={v.fill}
            stroke={v.stroke}
            strokeWidth={v.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={v.opacity}
            filter={
              v.glow && isActive
                ? `url(#${filterPrefix}-glow-strong)`
                : v.glow
                  ? `url(#${filterPrefix}-glow)`
                  : undefined
            }
            className="transition-[fill,stroke,opacity,stroke-width] duration-200 ease-out"
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            aria-label={`${BODY_PART_LABELS[region.id]}${score ? `, score ${score.score}` : ""}`}
            aria-pressed={selected === region.id}
            {...makeHandlers(region.id)}
          />
        );
      })}

      {/* Dimension ticks — technical plate language */}
      <g
        stroke="rgba(139,146,156,0.16)"
        strokeWidth={0.5}
        fill="none"
        pointerEvents="none"
      >
        <line x1={18} y1={48} x2={26} y2={48} />
        <line x1={174} y1={48} x2={182} y2={48} />
        <line x1={18} y1={154} x2={26} y2={154} />
        <line x1={174} y1={154} x2={182} y2={154} />
        <line x1={18} y1={280} x2={26} y2={280} />
        <line x1={174} y1={280} x2={182} y2={280} />
        <line x1={18} y1={420} x2={26} y2={420} />
        <line x1={174} y1={420} x2={182} y2={420} />
      </g>
      <g
        fill="rgba(139,146,156,0.28)"
        fontSize={6.5}
        fontFamily="var(--font-mono), monospace"
        pointerEvents="none"
      >
        <text x={10} y={50}>
          H
        </text>
        <text x={10} y={156}>
          T
        </text>
        <text x={10} y={282}>
          W
        </text>
        <text x={10} y={422}>
          F
        </text>
      </g>
    </g>
  );
}

export function BodySilhouette({
  scores,
  focusParts = [],
  selectedPart,
  onSelectPart,
  deltas,
  className,
  showLegend = true,
  compact = false,
  dimNonFocus = true,
}: BodySilhouetteProps) {
  const uid = useId().replace(/:/g, "");
  const [side, setSide] = useState<ViewSide>("front");
  const [hovered, setHovered] = useState<BodyPartId | null>(null);
  const map = useMemo(() => scoreMap(scores), [scores]);

  const activeId = hovered || selectedPart || null;
  const activeScore = activeId ? map.get(activeId) : null;
  const activeDelta = activeId && deltas ? deltas[activeId] : undefined;

  const laggingCount = useMemo(
    () => scores.filter((s) => s.status === "lagging").length,
    [scores]
  );

  const onSelect = useCallback(
    (id: BodyPartId) => {
      onSelectPart?.(id);
    },
    [onSelectPart]
  );

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex items-center gap-3">
        <SegmentedControl
          size="sm"
          value={side}
          onChange={setSide}
          options={[
            { value: "front", label: "Front" },
            { value: "back", label: "Back" },
          ]}
        />
      </div>

      <div
        className={cn(
          "relative w-full flex justify-center",
          compact ? "max-w-[200px]" : "max-w-[260px] sm:max-w-[280px]"
        )}
      >
        {/* Soft stage */}
        <div
          className="absolute inset-[-8%] rounded-[var(--radius-2xl)] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(94,200,192,0.045), transparent 70%)",
          }}
        />

        {/* Fine grid — very quiet */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(180,186,195,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(180,186,195,0.8) 1px, transparent 1px)
            `,
            backgroundSize: "18px 18px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          }}
        />

        <svg
          viewBox="0 0 200 480"
          className="w-full h-auto relative z-10 select-none touch-manipulation"
          style={{ maxHeight: compact ? 340 : 460 }}
          aria-label={`Body blueprint ${side} view. Tap a region for detail.`}
          role="img"
        >
          <defs>
            <linearGradient id="plate-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(22,24,30,0.55)" />
              <stop offset="100%" stopColor="rgba(12,14,18,0.75)" />
            </linearGradient>
            <filter
              id={`${uid}-glow`}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="1.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id={`${uid}-glow-strong`}
              x="-60%"
              y="-60%"
              width="220%"
              height="220%"
            >
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <AnimatePresence mode="wait">
            <motion.g
              key={side}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnatomyFigure
                side={side}
                map={map}
                focusParts={focusParts}
                selected={selectedPart}
                hovered={hovered}
                onHover={setHovered}
                onSelect={onSelect}
                dimNonFocus={dimNonFocus}
                filterPrefix={uid}
              />
            </motion.g>
          </AnimatePresence>
        </svg>

        {/* Floating readout — single chip, never cluttered */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 w-full flex justify-center px-2 pointer-events-none">
          <AnimatePresence mode="wait">
            {activeScore ? (
              <motion.div
                key={activeScore.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="glass-elevated rounded-full px-3.5 py-1.5 flex items-center gap-2.5 max-w-[95%]"
              >
                <span className="text-[12px] font-medium text-primary truncate">
                  {activeScore.label}
                </span>
                <span
                  className={cn(
                    "font-num text-[13px] tabular-nums",
                    activeScore.status === "lagging"
                      ? "text-cyan"
                      : "text-secondary"
                  )}
                >
                  {activeScore.score}
                </span>
                {activeDelta != null && activeDelta !== 0 && (
                  <span
                    className={cn(
                      "font-num text-[11px] tabular-nums",
                      activeDelta > 0 ? "text-cyan" : "text-warning"
                    )}
                  >
                    {activeDelta > 0 ? "+" : ""}
                    {activeDelta}
                  </span>
                )}
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-[0.1em]",
                    activeScore.status === "lagging"
                      ? "text-cyan/80"
                      : "text-muted"
                  )}
                >
                  {activeScore.status}
                </span>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-muted tracking-wide"
              >
                Tap a region
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center justify-center gap-4 text-[10px] text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan/80 shadow-[0_0_6px_var(--accent-cyan-glow)]" />
              Priority
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-steel/50" />
              Balanced
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-steel-muted/50" />
              Strong
            </span>
          </div>
          {(focusParts.length > 0 || laggingCount > 0) && (
            <p className="text-[10px] text-muted text-center tracking-wide max-w-[240px]">
              {focusParts.length > 0 ? (
                <>
                  Session focus ·{" "}
                  <span className="text-secondary">
                    {focusParts
                      .slice(0, 3)
                      .map((p) => BODY_PART_LABELS[p])
                      .join(" · ")}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-num text-secondary">{laggingCount}</span>{" "}
                  lagging regions mapped
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
