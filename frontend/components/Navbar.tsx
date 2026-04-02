"use client";

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

/** Default: fully transparent container; border + fill only on hover. */
const headerControlIdle =
  "h-10 border border-transparent bg-transparent text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-100";

/** On /dashboard: still transparent until hover; text hints current page. */
const headerControlDashboardActive =
  "h-10 border border-transparent bg-transparent text-teal-400 transition-colors hover:border-teal-600/50 hover:bg-teal-950/35 hover:text-white hover:ring-1 hover:ring-teal-600/25";

/** Menu open: outline only, transparent until hover. */
const headerControlUserMenuOpen =
  "h-10 border border-teal-600/50 bg-transparent text-white ring-1 ring-teal-600/25 transition-colors hover:bg-teal-950/35";

function displayInitials(displayName: string | undefined): string {
  if (!displayName?.trim()) return "?";
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]!}${parts[1][0]!}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const name = user?.displayName ?? "Account";

  return (
    <div className="relative z-20" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex max-w-[min(100%,14rem)] items-center gap-2 rounded-xl pl-1 pr-2 text-left ${
          open ? headerControlUserMenuOpen : headerControlIdle
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="user-menu-panel"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
            open ? "bg-teal-600/90" : "bg-slate-600/90"
          }`}
          aria-hidden
        >
          {displayInitials(user?.displayName)}
        </span>
        <span className="hidden min-w-0 flex-1 truncate text-sm font-medium sm:block">
          {name}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-current opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id="user-menu-panel"
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] w-56 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/95 py-1 shadow-xl ring-1 ring-black/30 backdrop-blur-sm"
        >
          <Link
            href="/settings"
            role="menuitem"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-800/80"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/80"
            onClick={() => {
              setOpen(false);
              logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const dashboardActive = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md supports-backdrop-filter:bg-slate-950/75">
      <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <div className="z-10 flex shrink-0 items-center">
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight text-teal-400"
          >
            RevSage Docs
          </Link>
        </div>

        <nav
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-label="Main"
        >
          <Link
            href="/dashboard"
            className={`pointer-events-auto inline-flex items-center gap-2 rounded-xl px-4 text-sm font-medium ${
              dashboardActive ? headerControlDashboardActive : headerControlIdle
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-current opacity-90" aria-hidden />
            Dashboard
          </Link>
        </nav>

        <div className="z-10 ml-auto flex shrink-0 items-center">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
