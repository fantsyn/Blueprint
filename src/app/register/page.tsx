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

export default function RegisterPage() {
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const register = useAuthStore((s) => s.register);
  const session = useAuthStore((s) => s.session);
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);
  const profile = useAppStore((s) => s.profile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authHydrated || !session) return;
    router.replace(profile?.onboardingComplete ? "/today" : "/onboarding");
  }, [authHydrated, session, profile, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await register({ name, email, password, remember });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.needsEmailConfirm) {
        setInfo(
          "Account created. Check your email to confirm, then sign in. (Or turn off email confirm in Supabase → Auth → Providers → Email.)"
        );
        return;
      }
      useAppStore.getState().updateOnboarding({ name: name.trim() });
      router.replace("/onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle={
        cloudEnabled
          ? "Cloud account — log in from phone, PC, or any browser."
          : "Add Supabase keys to enable cross-device accounts."
      }
      footer={
        <div className="text-center space-y-2.5">
          <p className="text-[13px] text-tertiary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan hover:text-cyan-bright transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="text-[11px] text-muted">
            {cloudEnabled ? "Synced with Supabase" : "Local device only"}
          </p>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Alex"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {!cloudEnabled && (
          <Checkbox
            checked={remember}
            onChange={setRemember}
            label="Remember me"
            hint="Stay signed in on this browser"
          />
        )}

        {error && (
          <p className="text-[13px] text-danger bg-[rgba(196,122,106,0.08)] border border-[rgba(196,122,106,0.2)] rounded-[var(--radius-md)] px-3 py-2.5">
            {error}
          </p>
        )}
        {info && (
          <p className="text-[13px] text-cyan bg-cyan-soft border border-cyan/20 rounded-[var(--radius-md)] px-3 py-2.5 leading-relaxed">
            {info}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
