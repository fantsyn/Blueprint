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
import { useAppStore } from "@/store/useAppStore";
import { useJournalStore } from "@/store/useJournalStore";

interface AuthState {
  session: AuthSession | null;
  hasHydrated: boolean;
  error: string | null;

  hydrate: () => void;
  clearError: () => void;
  register: (opts: {
    name: string;
    email: string;
    password: string;
    remember: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  login: (opts: {
    email: string;
    password: string;
    remember: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  /** Persist current app blueprint under the logged-in user */
  persistUserBlueprint: () => void;
}

function applyUserDataToApp(userId: string, accountName?: string) {
  const data = loadUserData(userId);
  if (data?.journal) {
    useJournalStore.getState().setJournal(data.journal);
  } else {
    useJournalStore.getState().resetJournal();
  }

  if (data?.profile) {
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
  } else {
    useAppStore.setState({
      profile: null,
      agenda: null,
      selectedBodyPart: null,
      nutritionPhase: "maintain",
      onboarding: {
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
}

function persistCurrentBlueprint(userId: string) {
  const { profile, agenda, nutritionPhase } = useAppStore.getState();
  const journal = useJournalStore.getState().journal;
  saveUserData(userId, {
    profile,
    agenda,
    nutritionPhase,
    journal,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  hasHydrated: false,
  error: null,

  hydrate: () => {
    const session = readSession();
    if (session) {
      // Refresh name if account was updated
      const accounts = loadAccounts();
      const account = accounts.find((a) => a.id === session.userId);
      const next = account
        ? { ...session, name: account.name, email: account.email }
        : session;
      if (account) writeSession({ ...next, remember: session.remember });
      set({ session: next, hasHydrated: true, error: null });
      applyUserDataToApp(next.userId, next.name);
    } else {
      set({ session: null, hasHydrated: true });
      if (useAppStore.persist.hasHydrated()) {
        useAppStore.getState().setHasHydrated(true);
      }
    }
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
    if (findAccountByEmail(normalized)) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const salt = randomSaltHex();
    const passwordHash = await hashPassword(password, salt);
    const account: StoredAccount = {
      id: `usr_${crypto.randomUUID()}`,
      email: normalized,
      name: name.trim() || normalized.split("@")[0],
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
        : new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12h
    };
    writeSession(session);
    set({ session, error: null, hasHydrated: true });
    applyUserDataToApp(account.id, account.name);
    return { ok: true };
  },

  login: async ({ email, password, remember }) => {
    const normalized = email.trim().toLowerCase();
    const account = findAccountByEmail(normalized);
    if (!account) {
      return { ok: false, error: "No account found for that email." };
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
    set({ session, error: null, hasHydrated: true });
    applyUserDataToApp(account.id, account.name);
    return { ok: true };
  },

  logout: () => {
    const { session } = get();
    if (session) {
      persistCurrentBlueprint(session.userId);
    }
    clearSession();
    useAppStore.getState().reset();
    useJournalStore.getState().resetJournal();
    set({ session: null, error: null });
  },

  persistUserBlueprint: () => {
    const { session } = get();
    if (!session) return;
    persistCurrentBlueprint(session.userId);
  },
}));

/** Call after blueprint mutations so the logged-in user's data is saved */
export function syncBlueprintToAccount() {
  useAuthStore.getState().persistUserBlueprint();
}
