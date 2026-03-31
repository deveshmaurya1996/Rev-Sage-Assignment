"use client";

import {
  type LucideIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const links: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-1 flex-col bg-slate-950 text-slate-100">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md supports-backdrop-filter:bg-slate-950/75">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-8">
            <Link
              href="/dashboard"
              className="shrink-0 font-semibold tracking-tight text-teal-400"
            >
              RevSage Docs
            </Link>
            <nav
              className="hidden min-w-0 md:flex md:items-center md:gap-1"
              aria-label="Main"
            >
              {links.map((l) => {
                const active = pathname === l.href;
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <span
              className="max-w-48 truncate text-sm text-slate-400"
              title={user?.displayName}
            >
              {user?.displayName}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Log out
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-slate-800 md:hidden"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          >
            {mobileNavOpen ? (
              <X className="h-6 w-6" strokeWidth={2} aria-hidden />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>

        <div
          id="mobile-nav"
          className={`border-t border-slate-800/80 bg-slate-900/95 md:hidden ${
            mobileNavOpen ? "block" : "hidden"
          }`}
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6"
            aria-label="Mobile"
          >
            {links.map((l) => {
              const active = pathname === l.href;
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800/80"
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {l.label}
                  </span>
                </Link>
              );
            })}
            <div className="mt-2 border-t border-slate-800 pt-3">
              <p className="truncate px-3 text-sm text-slate-500">
                {user?.displayName}
              </p>
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="mt-2 inline-flex w-full items-center gap-2 rounded-md border border-slate-600 px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                Log out
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
