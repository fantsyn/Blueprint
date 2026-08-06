"use client";

import { create } from "zustand";
import { hashPassword, randomSaltHex, verifyPassword } from "@/lib/auth/crypto";
import {
  clearSession,
  findAccountByEmail,
  loadAccounts,
  loadUserData,
  readSession,
  saveAccounts,
  saveUserData,
  writeSession,
  type AuthSession,
  type StoredAccount,
} from "@/lib/auth/storage";
import {
  getSupabaseBrowser,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  loadCloudBlueprint,
  saveCloudBlueprint,
  updateProfileName,
  type CloudBlueprintData,
} from "@/lib/supabase/sync";
import { useAppStore } from "@/store/useAppStore";
import { useJournalStore } from "@/store/useJournalStore";
import { emptyJournal } from "@/types/journal";

interface AuthState {
  session: AuthSession | null;
  hasHydrated: boolean;
  error: string | null;
  cloudEnabled: boolean;

  hydrate: () => Promise<void>;
  clearError: () => void;
  register: (opts: {
    name: string;
    email: string;
    password: string;
    remember: boolean;
  }) => Promise<
    { ok: true; needsEmailConfirm?: boolean } | { ok: false; error: string }
  >;
  login: (opts: {
    email: string;
    password: string;
    remember: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  persistUserBlueprint: () => Promise<void>;
}

/** Only run full hydrate once per page lifetime */
let hydratePromise: Promise<void> | null = null;
let authListenerBound = false;

function applyLoadedData(
  data: {
    profile: ReturnType<typeof useAppStore.getState>["profile"];
    agenda: ReturnType<typeof useAppStore.getState>["agenda"];
    nutritionPhase: ReturnType<typeof useAppStore.getState>["nutritionPhase"];
    journal?: ReturnType<typeof useJournalStore.getState>["journal"];
  },
  accountName?: string,
  opts?: { preserveOnboardingDraft?: boolean }
) {
  const current = useAppStore.getState();

  // Never clobber a finished blueprint with empty cloud/local
  if (
    !data.profile?.onboardingComplete &&
    current.profile?.onboardingComplete
  ) {
    if (data.journal) {
      useJournalStore.getState().setJournal(data.journal);
    }
    return;
  }

  if (data.journal) {
    useJournalStore.getState().setJournal(data.journal);
  } else if (!current.profile?.onboardingComplete) {
    // Only reset journal when starting fresh
    useJournalStore.getState().resetJournal();
  }

  if (data.profile?.onboardingComplete) {
    useAppStore.setState({
      profile: data.profile,
      agenda: data.agenda,
      nutritionPhase: data.nutritionPhase || "maintain",
      onboarding: {
        step: 0,
        name: data.profile.name || accountName || "",
        metrics: data.profile.metrics,
        photos: {},
        goal: data.profile.goal || { type: "recomposition", inspoImages: [] },
        inspoUrls: [],
      },
      selectedBodyPart: null,
      hasHydrated: true,
    });
    return;
  }

  // Empty / incomplete cloud — keep in-progress onboarding draft
  const keepDraft =
    opts?.preserveOnboardingDraft !== false &&
    (current.onboarding.step > 0 ||
      Boolean(current.onboarding.name) ||
      Boolean(current.onboarding.metrics.weightKg));

  useAppStore.setState({
    profile: data.profile ?? null,
    agenda: data.agenda ?? null,
    selectedBodyPart: null,
    nutritionPhase: data.nutritionPhase || current.nutritionPhase || "maintain",
    onboarding: keepDraft
      ? {
          ...current.onboarding,
          name:
            current.onboarding.name ||
            accountName ||
            current.onboarding.name,
        }
      : {
          step: 0,
          name: accountName || "",
          metrics: {
            age: 28,
            sex: "male",
            heightCm: 175,
            weightKg: 75,
            experience: "intermediate",
            equipment: "full_gym",
            injuries: [],
          },
          photos: {},
          goal: { type: "recomposition", inspoImages: [] },
          inspoUrls: [],
        },
    hasHydrated: true,
  });
}

function applyLocalUserData(userId: string, accountName?: string) {
  const data = loadUserData(userId);
  applyLoadedData(
    {
      profile: data?.profile ?? null,
      agenda: data?.agenda ?? null,
      nutritionPhase: data?.nutritionPhase || "maintain",
      journal: data?.journal,
    },
    accountName
  );
}

async function applyCloudUserData(userId: string, accountName?: string) {
  // Prefer local cache if it has a completed blueprint (fast path + offline)
  const local = loadUserData(userId);
  if (local?.profile?.onboardingComplete) {
    applyLoadedData(
      {
        profile: local.profile,
        agenda: local.agenda,
        nutritionPhase: local.nutritionPhase || "maintain",
        journal: local.journal,
      },
      accountName
    );
  }

  const data = await loadCloudBlueprint(userId);

  // Cloud has completed blueprint — use it
  if (data?.profile?.onboardingComplete) {
    applyLoadedData(data, accountName || data.profile.name);
    // Refresh local cache
    saveUserData(userId, data);
    return;
  }

  // Cloud empty but local completed — keep local and re-push
  if (local?.profile?.onboardingComplete) {
    void saveCloudBlueprint(userId, {
      profile: local.profile,
      agenda: local.agenda,
      nutritionPhase: local.nutritionPhase || "maintain",
      journal: local.journal || emptyJournal(),
    });
    return;
  }

  // Both incomplete — load cloud if any, but preserve draft
  if (data) {
    applyLoadedData(data, accountName, { preserveOnboardingDraft: true });
  } else if (!local?.profile) {
    applyLoadedData(
      {
        profile: null,
        agenda: null,
        nutritionPhase: "maintain",
        journal: emptyJournal(),
      },
      accountName,
      { preserveOnboardingDraft: true }
    );
  }
}

function snapshotBlueprint(): CloudBlueprintData {
  const { profile, agenda, nutritionPhase } = useAppStore.getState();
  const journal = useJournalStore.getState().journal;
  return { profile, agenda, nutritionPhase, journal };
}

async function persistCurrentBlueprint(userId: string, cloud: boolean) {
  const snap = snapshotBlueprint();
  saveUserData(userId, snap);
  if (cloud) {
    const result = await saveCloudBlueprint(userId, snap);
    if (!result.ok) {
      console.warn("[auth] cloud save failed", result.error);
    }
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  hasHydrated: false,
  error: null,
  cloudEnabled: false,

  hydrate: async () => {
    if (hydratePromise) return hydratePromise;

    hydratePromise = (async () => {
      const cloud = isSupabaseConfigured();
      set({ cloudEnabled: cloud });

      if (cloud) {
        const sb = getSupabaseBrowser();
        if (!sb) {
          set({ hasHydrated: true, session: null });
          return;
        }

        try {
          const { data } = await sb.auth.getSession();
          const s = data.session;
          if (s?.user) {
            const name =
              (s.user.user_metadata?.name as string) ||
              s.user.email?.split("@")[0] ||
              "Athlete";
            const session: AuthSession = {
              userId: s.user.id,
              email: s.user.email || "",
              name,
              remember: true,
              expiresAt: null,
            };
            set({
              session,
              hasHydrated: true,
              error: null,
              cloudEnabled: true,
            });
            await applyCloudUserData(s.user.id, name);
          } else {
            set({ session: null, hasHydrated: true, cloudEnabled: true });
            if (useAppStore.persist.hasHydrated()) {
              useAppStore.getState().setHasHydrated(true);
            }
          }

          if (!authListenerBound) {
            authListenerBound = true;
            sb.auth.onAuthStateChange(async (event, next) => {
              // Do not re-load blueprint on TOKEN_REFRESHED / INITIAL_SESSION
              // — that was wiping mid-onboarding progress.
              if (event === "SIGNED_OUT") {
                set({ session: null });
                return;
              }
              if (event === "SIGNED_IN" && next?.user) {
                const name =
                  (next.user.user_metadata?.name as string) ||
                  next.user.email?.split("@")[0] ||
                  "Athlete";
                const prev = get().session;
                // Only full load when user id changes (real new sign-in)
                if (!prev || prev.userId !== next.user.id) {
                  set({
                    session: {
                      userId: next.user.id,
                      email: next.user.email || "",
                      name,
                      remember: true,
                      expiresAt: null,
                    },
                  });
                  await applyCloudUserData(next.user.id, name);
                } else {
                  set({
                    session: {
                      ...prev,
                      email: next.user.email || prev.email,
                      name,
                    },
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn("[auth] cloud hydrate failed", e);
          set({ hasHydrated: true, session: null, cloudEnabled: true });
        }
        return;
      }

      // ── Local-only fallback ──
      const session = readSession();
      if (session) {
        const accounts = loadAccounts();
        const account = accounts.find((a) => a.id === session.userId);
        const next = account
          ? { ...session, name: account.name, email: account.email }
          : session;
        if (account) writeSession({ ...next, remember: session.remember });
        set({
          session: next,
          hasHydrated: true,
          error: null,
          cloudEnabled: false,
        });
        applyLocalUserData(next.userId, next.name);
      } else {
        set({ session: null, hasHydrated: true, cloudEnabled: false });
        if (useAppStore.persist.hasHydrated()) {
          useAppStore.getState().setHasHydrated(true);
        }
      }
    })();

    return hydratePromise;
  },

  clearError: () => set({ error: null }),

  register: async ({ name, email, password, remember }) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      return { ok: false, error: "Enter a valid email address." };
    }
    if (password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }

    const displayName = name.trim() || normalized.split("@")[0];

    if (isSupabaseConfigured()) {
      const sb = getSupabaseBrowser();
      if (!sb) return { ok: false, error: "Supabase client unavailable." };

      const { data, error } = await sb.auth.signUp({
        email: normalized,
        password,
        options: {
          data: { name: displayName },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (!data.session) {
        return { ok: true, needsEmailConfirm: true };
      }

      const user = data.user;
      if (!user) {
        return { ok: false, error: "Sign up failed — try again." };
      }

      await updateProfileName(user.id, displayName);

      const session: AuthSession = {
        userId: user.id,
        email: normalized,
        name: displayName,
        remember: true,
        expiresAt: null,
      };
      set({ session, error: null, hasHydrated: true, cloudEnabled: true });

      // Fresh account — do not wipe if we somehow have draft; start clean
      useAppStore.setState({
        profile: null,
        agenda: null,
        hasHydrated: true,
        onboarding: {
          step: 0,
          name: displayName,
          metrics: {
            age: 28,
            sex: "male",
            heightCm: 175,
            weightKg: 75,
            experience: "intermediate",
            equipment: "full_gym",
            injuries: [],
          },
          photos: {},
          goal: { type: "recomposition", inspoImages: [] },
          inspoUrls: [],
        },
      });
      useJournalStore.getState().resetJournal();
      void remember;
      return { ok: true };
    }

    if (findAccountByEmail(normalized)) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const salt = randomSaltHex();
    const passwordHash = await hashPassword(password, salt);
    const account: StoredAccount = {
      id: `usr_${crypto.randomUUID()}`,
      email: normalized,
      name: displayName,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    try {
      const accounts = loadAccounts();
      accounts.push(account);
      saveAccounts(accounts);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Could not create account.",
      };
    }

    const session: AuthSession = {
      userId: account.id,
      email: account.email,
      name: account.name,
      remember,
      expiresAt: remember
        ? null
        : new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    };
    writeSession(session);
    set({ session, error: null, hasHydrated: true, cloudEnabled: false });
    applyLocalUserData(account.id, account.name);
    return { ok: true };
  },

  login: async ({ email, password, remember }) => {
    const normalized = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const sb = getSupabaseBrowser();
      if (!sb) return { ok: false, error: "Supabase client unavailable." };

      const { data, error } = await sb.auth.signInWithPassword({
        email: normalized,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("invalid login") ||
          msg.includes("invalid credentials")
        ) {
          return {
            ok: false,
            error:
              "Invalid email or password. Create an account first if you haven’t.",
          };
        }
        if (msg.includes("email not confirmed")) {
          return {
            ok: false,
            error:
              "Confirm your email first (check inbox). Or disable email confirm in Supabase Auth settings.",
          };
        }
        return { ok: false, error: error.message };
      }

      const user = data.user;
      if (!user) return { ok: false, error: "Login failed." };

      const displayName =
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0] ||
        "Athlete";

      const session: AuthSession = {
        userId: user.id,
        email: user.email || normalized,
        name: displayName,
        remember: true,
        expiresAt: null,
      };
      set({ session, error: null, hasHydrated: true, cloudEnabled: true });
      await applyCloudUserData(user.id, displayName);
      void remember;
      return { ok: true };
    }

    const account = findAccountByEmail(normalized);
    if (!account) {
      return {
        ok: false,
        error:
          "No account found for that email on this device. Cloud login needs Supabase env vars.",
      };
    }
    const valid = await verifyPassword(
      password,
      account.salt,
      account.passwordHash
    );
    if (!valid) {
      return { ok: false, error: "Incorrect password." };
    }

    const session: AuthSession = {
      userId: account.id,
      email: account.email,
      name: account.name,
      remember,
      expiresAt: remember
        ? null
        : new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    };
    writeSession(session);
    set({ session, error: null, hasHydrated: true, cloudEnabled: false });
    applyLocalUserData(account.id, account.name);
    return { ok: true };
  },

  logout: async () => {
    const { session, cloudEnabled } = get();
    if (session) {
      await persistCurrentBlueprint(session.userId, cloudEnabled);
    }
    if (cloudEnabled) {
      const sb = getSupabaseBrowser();
      await sb?.auth.signOut();
    }
    clearSession();
    useAppStore.getState().reset();
    useJournalStore.getState().resetJournal();
    set({ session: null, error: null });
  },

  persistUserBlueprint: async () => {
    const { session, cloudEnabled } = get();
    if (!session) return;
    await persistCurrentBlueprint(session.userId, cloudEnabled);
  },
}));

export function syncBlueprintToAccount() {
  void useAuthStore.getState().persistUserBlueprint();
}

export async function syncBlueprintToAccountAsync() {
  await useAuthStore.getState().persistUserBlueprint();
}
