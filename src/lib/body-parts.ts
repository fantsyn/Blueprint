import type { BodyPartId, BodyPartScore } from "@/types";

export const BODY_PART_LABELS: Record<BodyPartId, string> = {
  traps: "Traps",
  shoulders: "Shoulders",
  chest: "Chest",
  lats: "Lats",
  mid_back: "Mid Back",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

export const ALL_BODY_PARTS: BodyPartId[] = Object.keys(
  BODY_PART_LABELS
) as BodyPartId[];

/** Regions visible on front vs back silhouette */
export const FRONT_PARTS: BodyPartId[] = [
  "traps",
  "shoulders",
  "chest",
  "biceps",
  "forearms",
  "abs",
  "obliques",
  "quads",
  "calves",
];

export const BACK_PARTS: BodyPartId[] = [
  "traps",
  "shoulders",
  "lats",
  "mid_back",
  "triceps",
  "forearms",
  "glutes",
  "hamstrings",
  "calves",
];

export function scoreToStatus(
  score: number
): BodyPartScore["status"] {
  if (score < 45) return "lagging";
  if (score > 70) return "strong";
  return "balanced";
}

export function scoreToPriority(score: number): number {
  // Lower score = higher priority (1 = top focus)
  if (score < 40) return 1;
  if (score < 50) return 2;
  if (score < 60) return 3;
  return 4;
}

export function statusColor(status: BodyPartScore["status"]): string {
  switch (status) {
    case "lagging":
      return "var(--accent-cyan)";
    case "strong":
      return "var(--steel-muted)";
    default:
      return "var(--steel)";
  }
}

export function highlightIntensity(score: BodyPartScore): number {
  // Lagging parts get stronger glow
  if (score.status === "lagging") return 0.85;
  if (score.priority <= 2) return 0.55;
  return 0.2;
}
