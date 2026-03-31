"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { DocumentRecord } from "@/lib/types";

export function useDocument(token: string | null, id: string | undefined) {
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) {
      setDoc(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await apiFetch<DocumentRecord>(`/documents/${id}`, {
        token,
      });
      setDoc(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load document");
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const mergeUpdate = useCallback((patch: Partial<DocumentRecord>) => {
    setDoc((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return { doc, loading, error, refetch: load, mergeUpdate };
}
