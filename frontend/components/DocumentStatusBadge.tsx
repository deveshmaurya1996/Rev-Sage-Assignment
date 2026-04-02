import type { DocumentStatus } from "@/lib/types";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  QUEUED: "bg-amber-500/20 text-amber-300",
  PROCESSING: "bg-sky-500/20 text-sky-300",
  DONE: "bg-emerald-500/20 text-emerald-300",
  FAILED: "bg-rose-500/20 text-rose-300",
};

export interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}${className ? ` ${className}` : ""}`}
    >
      {status}
    </span>
  );
}
