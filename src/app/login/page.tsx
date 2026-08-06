"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { useAuthHydration } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const login = useAuthStore((s) => s.login);
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authHydrated || !session) return;
    router.replace(profile?.onboardingComplete ? "/today" : "/onboarding");
  }, [authHydrated, session, profile, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login({ email, password, remember });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const p = useAppStore.getState().profile;
      router.replace(p?.onboardingComplete ? "/today" : "/onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your blueprint. Remember me keeps you signed in on this device."
      footer={
        <div className="text-center space-y-2.5">
          <p className="text-[13px] text-tertiary">
            No account yet?{" "}
            <Link
              href="/register"
              className="text-cyan hover:text-cyan-bright transition-colors"
            >
              Create one
            </Link>
          </p>
          <p className="text-[11px] text-muted">
            <Link href="/" className="link-quiet">
              Back to home
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Checkbox
          checked={remember}
          onChange={setRemember}
          label="Remember me"
          hint="Stay signed in on this browser until you log out"
        />

        {error && (
          <p className="text-[13px] text-danger bg-[rgba(196,122,106,0.08)] border border-[rgba(196,122,106,0.2)] rounded-[var(--radius-md)] px-3 py-2.5">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
