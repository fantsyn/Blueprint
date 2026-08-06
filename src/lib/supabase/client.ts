import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Resolve URL/key from several naming schemes:
 * - Classic: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - New / Vercel integration: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * - Non-public aliases sometimes injected by integrations
 */
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() != null;
}

/**
 * Browser Supabase client (singleton).
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  if (!client) {
    client = createClient(env.url, env.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }
  return client;
}
