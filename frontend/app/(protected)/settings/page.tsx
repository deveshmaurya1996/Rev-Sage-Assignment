"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiRequestError } from "@/lib/api";

export default function SettingsPage() {
  const { token, user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const updated = await apiFetch<{
        id: string;
        email: string;
        displayName: string;
      }>("/users/me", {
        method: "PATCH",
        token,
        body: JSON.stringify({ displayName }),
      });
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not update profile",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold text-white">Profile</h1>
      <p className="mt-1 text-sm text-slate-400">
        Changing your display name does not affect names stored on completed
        documents.
      </p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Email</span>
          <input
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-500"
            value={user?.email ?? ""}
            disabled
            readOnly
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Display name</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-teal-500"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-emerald-400">Saved.</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
