import type { DayAgenda, NutritionPhase, UserProfile } from "@/types";
import type { UserJournal } from "@/types/journal";
import { emptyJournal } from "@/types/journal";

export const ACCOUNTS_KEY = "blueprint-accounts";
export const SESSION_KEY = "blueprint-session";

export interface StoredAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  remember: boolean;
  expiresAt: string | null;
}

export interface UserDataBlob {
  profile: UserProfile | null;
  agenda: DayAgenda | null;
  nutritionPhase: NutritionPhase;
  journal?: UserJournal;
}

function userDataKey(userId: string) {
  return `blueprint-user-${userId}`;
}

export function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn("[auth] could not save accounts", e);
    throw new Error("Could not save account — storage full or blocked.");
  }
}

export function findAccountByEmail(email: string): StoredAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return loadAccounts().find((a) => a.email === normalized);
}

export function writeSession(session: AuthSession) {
  const json = JSON.stringify(session);
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (session.remember) {
      localStorage.setItem(SESSION_KEY, json);
    } else {
      sessionStorage.setItem(SESSION_KEY, json);
    }
  } catch (e) {
    console.warn("[auth] session write failed", e);
  }
}

export function readSession(): AuthSession | null {
  try {
    const raw =
      sessionStorage.getItem(SESSION_KEY) ||
      localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt) {
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        clearSession();
        return null;
      }
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function slimJournal(j?: UserJournal): UserJournal {
  const base = j || emptyJournal();
  // Cap chat history to last 40 messages; never store image payloads
  return {
    ...base,
    workouts: (base.workouts || []).slice(0, 200),
    meals: (base.meals || []).slice(0, 300),
    weights: (base.weights || []).slice(0, 200),
    steps: (base.steps || []).slice(0, 200),
    goalChanges: (base.goalChanges || []).slice(0, 50),
    preferences: (base.preferences || []).slice(0, 100),
    physiqueUpdates: (base.physiqueUpdates || []).slice(0, 20).map((p) => ({
      ...p,
      // ensure no accidental image fields
    })),
    chat: (base.chat || []).slice(-40).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content.slice(0, 4000),
      createdAt: m.createdAt,
      applied: m.applied,
    })),
  };
}

export function loadUserData(userId: string): UserDataBlob | null {
  try {
    const raw = localStorage.getItem(userDataKey(userId));
    if (!raw) return null;
    const data = JSON.parse(raw) as UserDataBlob;
    return {
      ...data,
      journal: slimJournal(data.journal),
    };
  } catch {
    return null;
  }
}

export function saveUserData(userId: string, data: UserDataBlob) {
  try {
    const slim: UserDataBlob = {
      ...data,
      profile: data.profile
        ? {
            ...data.profile,
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
      journal: slimJournal(data.journal),
    };
    localStorage.setItem(userDataKey(userId), JSON.stringify(slim));
  } catch (e) {
    console.warn("[auth] user data save failed", e);
    // Retry without chat if quota
    try {
      const j = slimJournal(data.journal);
      const minimal: UserDataBlob = {
        profile: data.profile
          ? { ...data.profile, photos: [] }
          : null,
        agenda: data.agenda,
        nutritionPhase: data.nutritionPhase,
        journal: { ...j, chat: [] },
      };
      localStorage.setItem(userDataKey(userId), JSON.stringify(minimal));
    } catch {
      /* ignore */
    }
  }
}

export function deleteUserData(userId: string) {
  try {
    localStorage.removeItem(userDataKey(userId));
  } catch {
    /* ignore */
  }
}
