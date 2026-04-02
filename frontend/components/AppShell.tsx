"use client";

import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

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
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
