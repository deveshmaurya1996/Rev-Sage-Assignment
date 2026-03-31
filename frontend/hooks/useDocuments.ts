"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { DocumentRecord, DocumentStatus, DocumentType } from "@/lib/types";

export interface DocumentListFilters {
  status?: DocumentStatus | "";
  type?: DocumentType | "";
  search?: string;
}

export function useDocuments(token: string | null, filters: DocumentListFilters) {
  const [data, setData] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.type) params.set("type", filters.type);
      if (filters.search?.trim()) params.set("search", filters.search.trim());
      const q = params.toString();
      const path = q ? `/documents?${q}` : "/documents";
      const rows = await apiFetch<DocumentRecord[]>(path, { token });
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters.status, filters.type, filters.search]);

  useEffect(() => {
    void load();
  }, [load]);

  return { documents: data, loading, error, refetch: load };
}
