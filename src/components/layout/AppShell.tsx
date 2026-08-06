"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PersonStanding,
  Utensils,
  ChartNoAxesCombined,
  Hexagon,
  LogOut,
  User,
  MessageSquare,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";

const NAV = [
  { href: "/today", label: "Today", icon: LayoutDashboard },
  { href: "/coach", label: "Coach", icon: MessageSquare },
  { href: "/workouts", label: "Log", icon: CalendarDays },
  { href: "/blueprint", label: "Map", icon: PersonStanding },
  { href: "/progress", label: "Progress", icon: ChartNoAxesCombined },
];

const DESKTOP_EXTRA = [
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const profile = useAppStore((s) => s.profile);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = session?.name || profile?.name || "Guest";
  const displayEmail = session?.email;
  const desktopNav = [...NAV, ...DESKTOP_EXTRA];

  const handleLogout = () => {
    setMenuOpen(false);
    void Promise.resolve(logout()).then(() => {
      router.replace("/login");
    });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-base">
      <header className="sticky top-0 z-40 border-b border-border-subtle/80 bg-base/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-[3.5rem] max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/today" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-cyan/20 bg-cyan-soft shadow-[0_0_20px_rgba(94,200,192,0.08)] transition-shadow group-hover:shadow-[0_0_24px_rgba(94,200,192,0.14)]">
              <Hexagon className="h-3.5 w-3.5 text-cyan" strokeWidth={1.75} />
            </div>
            <span className="text-[13px] font-medium tracking-tight text-primary group-hover:text-cyan transition-colors duration-200">
              Blueprint
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {desktopNav.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-[13px] transition-all duration-200",
                    active
                      ? "bg-surface text-primary border border-border shadow-[var(--shadow-btn)]"
                      : "text-tertiary hover:text-secondary hover:bg-hover/70 border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 opacity-80" strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-md)] px-1.5 py-1 sm:px-2 sm:py-1.5 text-sm transition-all duration-200",
                "text-secondary hover:text-primary hover:bg-hover/80",
                "border border-transparent hover:border-border-subtle",
                menuOpen && "bg-hover border-border-subtle"
              )}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-elevated">
                <User className="h-3.5 w-3.5 text-steel" strokeWidth={1.75} />
              </span>
              <span className="hidden sm:block max-w-[100px] truncate text-[12px] font-medium">
                {displayName}
              </span>
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 glass-elevated rounded-[var(--radius-lg)] py-1.5 overflow-hidden animate-fade-up"
                >
                  <div className="px-3.5 py-3 border-b border-border-subtle">
                    <p className="text-[13px] text-primary font-medium truncate">
                      {displayName}
                    </p>
                    {displayEmail ? (
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {displayEmail}
                        {session?.remember ? " · remembered" : ""}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted mt-0.5">Guest demo</p>
                    )}
                  </div>
                  <div className="py-1">
                    <Link
                      href="/update"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-secondary hover:bg-hover hover:text-primary transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan/70" />
                      Physique update
                    </Link>
                    <Link
                      href="/nutrition"
                      role="menuitem"
                      className="md:hidden flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-secondary hover:bg-hover hover:text-primary transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Utensils className="h-3.5 w-3.5" />
                      Nutrition
                    </Link>
                  </div>
                  <div className="border-t border-border-subtle py-1">
                    {!session && (
                      <Link
                        href="/login"
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-secondary hover:bg-hover hover:text-primary transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        Sign in to save
                      </Link>
                    )}
                    {session ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-secondary hover:bg-hover hover:text-primary transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          useAppStore.getState().reset();
                          setMenuOpen(false);
                          router.replace("/");
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-secondary hover:bg-hover hover:text-primary transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Exit demo
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 pb-28 md:pb-12 animate-fade-up">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border-subtle/80 bg-base/85 backdrop-blur-2xl pb-safe">
        <div className="flex items-stretch justify-around h-[4.25rem] max-w-lg mx-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] tracking-wide transition-colors duration-200",
                  active ? "text-cyan" : "text-tertiary"
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-cyan/60 rounded-full shadow-[0_0_8px_var(--accent-cyan-glow)]" />
                )}
                <Icon
                  className={cn("h-[1.15rem] w-[1.15rem]", active && "nav-active-glow")}
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className={cn(active && "font-medium")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
