"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Settings,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { useBibleStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reading-plan", label: "Plan", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

function sectionLabel(pathname: string) {
  const item = NAV.find((n) => pathname.startsWith(n.href));
  return item?.label ?? "Dashboard";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, hydrated, userEmail, signOut, authBusy } = useBibleStore();
  const [signOutError, setSignOutError] = useState("");
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">
        Loading your reading plan…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--border)] px-4 py-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--green)] flex items-center justify-center">
            <BookOpen size={18} color="#f6f2e9" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-semibold text-[15px] leading-tight text-[var(--ink)]">
              Bible Tracker
            </div>
            <div className="text-xs text-[var(--ink-faint)]">{today}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--green)] text-[#f6f2e9]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-2 text-xs text-[var(--ink-faint)]">
          {userEmail ? `Signed in as ${state.userName}` : "Guest profile"}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Shared header */}
        <header className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <BookOpen size={16} color="#f6f2e9" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight text-[var(--ink)]">
                Bible Tracker <span className="text-[var(--ink-faint)]">&middot; {sectionLabel(pathname)}</span>
              </div>
              <div className="text-[11px] text-[var(--ink-faint)]">{today}</div>
            </div>
          </div>
          <div className="hidden md:block font-semibold text-[var(--ink)]">
            {sectionLabel(pathname)}
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center"
            >
              <Bell size={16} className="text-[var(--ink-soft)]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
            </button>
            <details className="relative">
              <summary
                aria-label="Open account menu"
                title="Account menu"
                className="list-none cursor-pointer w-9 h-9 rounded-full bg-[var(--green-soft)] border border-[var(--border)] flex items-center justify-center text-sm font-semibold text-[var(--green-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              >
                {state.userName.slice(0, 1).toUpperCase()}
              </summary>
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg z-30">
                <div className="px-2 py-2 border-b border-[var(--border)]">
                  <div className="text-sm font-semibold text-[var(--ink)]">{state.userName}</div>
                  <div className="text-xs text-[var(--ink-soft)] mt-0.5">
                    {userEmail ?? "Guest profile · saved in this browser"}
                  </div>
                </div>
                <Link
                  href="/settings"
                  className="block rounded-lg px-2 py-2.5 mt-1 text-sm text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                >
                  Profile and settings
                </Link>
                {userEmail ? (
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={async () => {
                      const error = await signOut();
                      if (error) {
                        setSignOutError(error);
                        return;
                      }
                      router.replace("/login");
                    }}
                    className="w-full text-left rounded-lg px-2 py-2.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {authBusy ? "Signing out…" : "Sign out"}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block rounded-lg px-2 py-2.5 text-sm font-semibold text-[var(--green-dark)] hover:bg-[var(--surface-soft)]"
                  >
                    Sign in to sync
                  </Link>
                )}
                {signOutError && <p role="alert" className="px-2 pt-2 text-xs text-red-700">{signOutError}</p>}
              </div>
            </details>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-10 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] flex items-stretch justify-between px-2 z-20">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  active ? "bg-[var(--green-soft)]" : ""
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={active ? "text-[var(--green-dark)]" : "text-[var(--ink-faint)]"}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-[var(--green-dark)]" : "text-[var(--ink-faint)]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
