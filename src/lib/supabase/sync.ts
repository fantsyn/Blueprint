import type { DayAgenda, NutritionPhase, UserProfile } from "@/types";
import type { UserJournal } from "@/types/journal";
import { emptyJournal } from "@/types/journal";
import { getSupabaseBrowser } from "./client";

export interface CloudBlueprintData {
  profile: UserProfile | null;
  agenda: DayAgenda | null;
  nutritionPhase: NutritionPhase;
  journal: UserJournal;
}

function slimForCloud(data: CloudBlueprintData): CloudBlueprintData {
  return {
    profile: data.profile
      ? {
          ...data.profile,
          // Never store huge base64 photos in cloud JSON
          photos: (data.profile.photos || []).filter(
            (p) => p.url && !p.url.startsWith("data:")
          ),
          goal: {
            ...data.profile.goal,
            inspoImages: (data.profile.goal?.inspoImages || []).filter(
              (img) => img.url && !img.url.startsWith("data:")
            ),
          },
        }
      : null,
    agenda: data.agenda,
    nutritionPhase: data.nutritionPhase,
    journal: {
      ...emptyJournal(),
      ...data.journal,
      // Cap chat for payload size
      chat: (data.journal?.chat || []).slice(-40).map((m) => ({
        ...m,
        content: m.content.slice(0, 4000),
      })),
      workouts: (data.journal?.workouts || []).slice(0, 200),
      meals: (data.journal?.meals || []).slice(0, 300),
      physiqueUpdates: (data.journal?.physiqueUpdates || []).slice(0, 20),
    },
  };
}

export async function loadCloudBlueprint(
  userId: string
): Promise<CloudBlueprintData | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const { data, error } = await sb
    .from("user_blueprints")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[supabase] load blueprint", error.message);
    return null;
  }
  if (!data?.data || typeof data.data !== "object") return null;

  const raw = data.data as Partial<CloudBlueprintData>;
  // Treat empty {} trigger-created rows as "no data yet"
  const hasProfile = Boolean(
    raw.profile &&
      typeof raw.profile === "object" &&
      (raw.profile as UserProfile).onboardingComplete
  );
  if (!hasProfile && !raw.agenda && !raw.journal) {
    return null;
  }

  return {
    profile: (raw.profile as UserProfile) ?? null,
    agenda: raw.agenda ?? null,
    nutritionPhase: raw.nutritionPhase || "maintain",
    journal: raw.journal || emptyJournal(),
  };
}

export async function saveCloudBlueprint(
  userId: string,
  payload: CloudBlueprintData
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabaseBrowser();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const slim = slimForCloud(payload);
  const { error } = await sb.from("user_blueprints").upsert(
    {
      user_id: userId,
      data: slim,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.warn("[supabase] save blueprint", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function updateProfileName(userId: string, name: string) {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  await sb
    .from("profiles")
    .upsert({ id: userId, name, updated_at: new Date().toISOString() });
}
