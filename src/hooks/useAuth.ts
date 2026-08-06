"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";

/** Hydrate auth session once on app surfaces */
export function useAuthHydration() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return hasHydrated;
}

/**
 * Gate authenticated app routes.
 * - Must be logged in (session)
 * - If no blueprint yet → onboarding
 * - Guest demo (profile without session) still allowed if profile exists
 */
export function useRequireAuth(opts?: { allowGuestDemo?: boolean }) {
  const allowGuestDemo = opts?.allowGuestDemo ?? true;
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const agenda = useAppStore((s) => s.agenda);
  const appHydrated = useAppStore((s) => s.hasHydrated);
  const setHasHydrated = useAppStore((s) => s.setHasHydrated);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) setHasHydrated(true);
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return unsub;
  }, [setHasHydrated]);

  const ready = authHydrated && (appHydrated || Boolean(session));

  useEffect(() => {
    if (!authHydrated) return;

    if (!session) {
      // Guest demo path
      if (allowGuestDemo && profile?.onboardingComplete) return;
      router.replace("/login");
      return;
    }

    if (!profile?.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [authHydrated, session, profile, allowGuestDemo, router]);

  const hasAccess =
    Boolean(session && profile?.onboardingComplete) ||
    Boolean(allowGuestDemo && profile?.onboardingComplete);

  return {
    ready: ready && hasAccess,
    session,
    profile,
    agenda,
    authHydrated,
  };
}
