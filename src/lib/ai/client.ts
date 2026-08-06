/**
 * SpaceXAI (xAI) client helpers for Blueprint.
 * Server-side only — never expose XAI_API_KEY to the browser.
 *
 * Env: XAI_API_KEY
 * Base: https://api.x.ai/v1
 * Default model: grok-4.5 (vision-capable models for physique analysis)
 */

import OpenAI from "openai";

export function getXaiClient(): OpenAI | null {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: "https://api.x.ai/v1",
  });
}

export const DEFAULT_MODEL = "grok-4.5";
/** Prefer a vision-capable model when analyzing photos */
export const VISION_MODEL = "grok-4.5";
