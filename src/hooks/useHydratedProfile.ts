"use client";

import { useRequireAuth } from "@/hooks/useAuth";

/**
 * Wait for auth + blueprint before rendering app screens.
 * Logged-in users without a blueprint are sent to onboarding.
 */
export function useHydratedProfile(opts?: { requireProfile?: boolean }) {
  const requireProfile = opts?.requireProfile ?? true;
  const auth = useRequireAuth({ allowGuestDemo: true });

  if (!requireProfile) {
    return {
      ready: auth.authHydrated,
      profile: auth.profile,
      agenda: auth.agenda,
      hasHydrated: auth.authHydrated,
      session: auth.session,
    };
  }

  return {
    ready: auth.ready,
    profile: auth.profile,
    agenda: auth.agenda,
    hasHydrated: auth.authHydrated,
    session: auth.session,
  };
}
