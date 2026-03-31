"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api";
import type { DocumentRecord, DocumentStatus, DocumentUpdateEvent } from "@/lib/types";

export function useDocumentSocket(
  token: string | null,
  documentId: string | undefined,
  onUpdate: (patch: Partial<DocumentRecord>) => void,
  enabled: boolean,
) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!token || !documentId || !enabled) {
      return;
    }

    const base = getApiBaseUrl();
    const socket = io(`${base}/documents`, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const handler = (payload: DocumentUpdateEvent) => {
      if (payload.documentId !== documentId) return;
      onUpdateRef.current({
        status: payload.status as DocumentStatus,
        result: payload.result,
        processorDisplayName: payload.processorDisplayName,
        updatedAt: payload.updatedAt,
      });
    };

    socket.on("document:update", handler);

    return () => {
      socket.off("document:update", handler);
      socket.disconnect();
    };
  }, [token, documentId, enabled]);
}
