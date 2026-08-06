import type { BodyPartId } from "@/types";
import type { PhysiqueUpdate } from "@/types/journal";

/** Latest physique update deltas for hologram readout */
export function deltasFromPhysiqueUpdates(
  updates: PhysiqueUpdate[]
): Partial<Record<BodyPartId, number>> | undefined {
  const latest = updates[0];
  if (!latest?.previousScores?.length) return undefined;
  const out: Partial<Record<BodyPartId, number>> = {};
  for (const s of latest.scores) {
    const prev = latest.previousScores.find((p) => p.id === s.id);
    if (prev) {
      const d = s.score - prev.score;
      if (d !== 0) out[s.id] = d;
    }
  }
  return Object.keys(out).length ? out : undefined;
}
