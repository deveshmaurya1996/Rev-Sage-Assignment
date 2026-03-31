"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  apiFetch,
  clearStoredAuth,
  writeStoredAuth,
  type StoredAuth,
} from "@/lib/api";
import {
  getAuthSnapshot,
  getServerAuthSnapshot,
  notifyAuthChanged,
  subscribeAuth,
} from "@/lib/auth-store";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  const hydrated = typeof window !== "undefined";

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{
      accessToken: string;
      user: UserProfile;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const next: StoredAuth = {
      accessToken: data.accessToken,
      user: data.user,
    };
    writeStoredAuth(next);
    notifyAuthChanged();
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const data = await apiFetch<{
        accessToken: string;
        user: UserProfile;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      const next: StoredAuth = {
        accessToken: data.accessToken,
        user: data.user,
      };
      writeStoredAuth(next);
      notifyAuthChanged();
    },
    [],
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    notifyAuthChanged();
  }, []);

  const setUser = useCallback((user: UserProfile) => {
    const prev = getAuthSnapshot();
    if (!prev) {
      return;
    }
    const next: StoredAuth = { ...prev, user };
    writeStoredAuth(next);
    notifyAuthChanged();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: auth?.accessToken ?? null,
      user: auth?.user ?? null,
      hydrated,
      isAuthenticated: Boolean(auth?.accessToken),
      login,
      register,
      logout,
      setUser,
    }),
    [auth, hydrated, login, register, logout, setUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
