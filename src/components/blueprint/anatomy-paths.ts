import type { BodyPartId } from "@/types";

/**
 * Technical anatomy regions — viewBox 0 0 200 480
 * Abstract architectural figure, not medical illustration.
 * Symmetric pairs share the same BodyPartId for unified selection.
 */

export type AnatomyPath = {
  id: BodyPartId;
  d: string;
  /** side indicator for pairing */
  side?: "L" | "R" | "C";
};

/** Outer silhouette (non-interactive plate) */
export const OUTER_SILHOUETTE =
  "M100 26 C86 26 78 38 78 50 C78 58 81 65 86 70 L80 80 C66 92 52 108 46 130 L38 168 C34 184 38 190 48 194 L56 198 L50 252 C48 268 52 274 60 276 L68 280 L62 338 C58 368 56 398 64 422 L72 448 C74 458 82 464 92 464 L92 470 C92 476 96 478 100 478 C104 478 108 476 108 470 L108 464 C118 464 126 458 128 448 L136 422 C144 398 142 368 138 338 L132 280 L140 276 C148 274 152 268 150 252 L144 198 L152 194 C162 190 166 184 162 168 L154 130 C148 108 134 92 120 80 L114 70 C119 65 122 58 122 50 C122 38 114 26 100 26 Z";

export const HEAD_PATH =
  "M100 28 C88 28 80 38 81 50 C82 60 88 68 100 70 C112 68 118 60 119 50 C120 38 112 28 100 28 Z";

export const NECK_PATH =
  "M92 68 L108 68 L110 78 L90 78 Z";

/** Front interactive regions */
export const FRONT_REGIONS: AnatomyPath[] = [
  // Traps (upper neck shelf)
  {
    id: "traps",
    side: "C",
    d: "M86 76 C90 74 96 78 100 80 C104 78 110 74 114 76 L112 92 C108 96 104 98 100 98 C96 98 92 96 88 92 Z",
  },
  // Shoulders
  {
    id: "shoulders",
    side: "L",
    d: "M54 96 C46 102 42 114 44 130 L52 136 C56 120 62 108 72 98 L64 90 C60 92 56 94 54 96 Z",
  },
  {
    id: "shoulders",
    side: "R",
    d: "M146 96 C154 102 158 114 156 130 L148 136 C144 120 138 108 128 98 L136 90 C140 92 144 94 146 96 Z",
  },
  // Chest
  {
    id: "chest",
    side: "C",
    d: "M76 96 C84 92 92 94 100 98 C108 94 116 92 124 96 L130 132 C122 148 110 154 100 154 C90 154 78 148 70 132 Z",
  },
  // Biceps
  {
    id: "biceps",
    side: "L",
    d: "M46 132 L60 128 L62 172 L48 178 C42 162 42 144 46 132 Z",
  },
  {
    id: "biceps",
    side: "R",
    d: "M154 132 L140 128 L138 172 L152 178 C158 162 158 144 154 132 Z",
  },
  // Forearms
  {
    id: "forearms",
    side: "L",
    d: "M48 180 L62 176 L58 238 L44 242 C40 212 42 192 48 180 Z",
  },
  {
    id: "forearms",
    side: "R",
    d: "M152 180 L138 176 L142 238 L156 242 C160 212 158 192 152 180 Z",
  },
  // Abs
  {
    id: "abs",
    side: "C",
    d: "M88 156 L112 156 L114 222 L86 222 Z",
  },
  // Obliques
  {
    id: "obliques",
    side: "L",
    d: "M70 150 L88 156 L86 222 L66 216 C64 186 66 162 70 150 Z",
  },
  {
    id: "obliques",
    side: "R",
    d: "M130 150 L112 156 L114 222 L134 216 C136 186 134 162 130 150 Z",
  },
  // Quads
  {
    id: "quads",
    side: "L",
    d: "M70 228 L98 232 L96 328 L68 322 C66 278 68 246 70 228 Z",
  },
  {
    id: "quads",
    side: "R",
    d: "M130 228 L102 232 L104 328 L132 322 C134 278 132 246 130 228 Z",
  },
  // Calves
  {
    id: "calves",
    side: "L",
    d: "M70 348 L96 352 L94 428 L72 424 C68 390 68 364 70 348 Z",
  },
  {
    id: "calves",
    side: "R",
    d: "M130 348 L104 352 L106 428 L128 424 C132 390 132 364 130 348 Z",
  },
];

/** Back interactive regions */
export const BACK_REGIONS: AnatomyPath[] = [
  {
    id: "traps",
    side: "C",
    d: "M84 74 C90 72 96 80 100 84 C104 80 110 72 116 74 L114 104 C108 112 104 116 100 116 C96 116 92 112 86 104 Z",
  },
  {
    id: "shoulders",
    side: "L",
    d: "M54 96 C46 102 42 114 44 130 L52 136 C56 120 62 108 72 98 L64 90 C60 92 56 94 54 96 Z",
  },
  {
    id: "shoulders",
    side: "R",
    d: "M146 96 C154 102 158 114 156 130 L148 136 C144 120 138 108 128 98 L136 90 C140 92 144 94 146 96 Z",
  },
  {
    id: "lats",
    side: "L",
    d: "M70 108 L88 114 L86 200 L58 178 C54 148 60 118 70 108 Z",
  },
  {
    id: "lats",
    side: "R",
    d: "M130 108 L112 114 L114 200 L142 178 C146 148 140 118 130 108 Z",
  },
  {
    id: "mid_back",
    side: "C",
    d: "M88 116 L112 116 L114 192 L86 192 Z",
  },
  {
    id: "triceps",
    side: "L",
    d: "M46 132 L60 128 L62 172 L48 178 C42 162 42 144 46 132 Z",
  },
  {
    id: "triceps",
    side: "R",
    d: "M154 132 L140 128 L138 172 L152 178 C158 162 158 144 154 132 Z",
  },
  {
    id: "forearms",
    side: "L",
    d: "M48 180 L62 176 L58 238 L44 242 C40 212 42 192 48 180 Z",
  },
  {
    id: "forearms",
    side: "R",
    d: "M152 180 L138 176 L142 238 L156 242 C160 212 158 192 152 180 Z",
  },
  {
    id: "glutes",
    side: "L",
    d: "M70 204 L100 210 L100 258 L68 252 C66 228 68 212 70 204 Z",
  },
  {
    id: "glutes",
    side: "R",
    d: "M130 204 L100 210 L100 258 L132 252 C134 228 132 212 130 204 Z",
  },
  {
    id: "hamstrings",
    side: "L",
    d: "M70 260 L98 264 L96 346 L68 340 C66 300 68 274 70 260 Z",
  },
  {
    id: "hamstrings",
    side: "R",
    d: "M130 260 L102 264 L104 346 L132 340 C134 300 132 274 130 260 Z",
  },
  {
    id: "calves",
    side: "L",
    d: "M70 352 L96 356 L94 428 L72 424 C68 392 68 368 70 352 Z",
  },
  {
    id: "calves",
    side: "R",
    d: "M130 352 L104 356 L106 428 L128 424 C132 392 132 368 130 352 Z",
  },
];
