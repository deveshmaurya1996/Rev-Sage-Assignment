"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthGate } from "@/components/AuthGate";
import { useDocument } from "@/hooks/useDocument";
import { useDocumentSocket } from "@/hooks/useDocumentSocket";
import type { DocumentStatus } from "@/lib/types";

function statusBadge(status: DocumentStatus) {
  const map: Record<DocumentStatus, string> = {
    QUEUED: "bg-amber-500/20 text-amber-300",
    PROCESSING: "bg-sky-500/20 text-sky-300",
    DONE: "bg-emerald-500/20 text-emerald-300",
    FAILED: "bg-rose-500/20 text-rose-300",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

function DocumentDetailContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;
  const { token } = useAuth();
  const { doc, loading, error, mergeUpdate } = useDocument(token, id);

  const live =
    Boolean(doc) && (doc!.status === "QUEUED" || doc!.status === "PROCESSING");

  useDocumentSocket(token, id, mergeUpdate, live);

  if (loading && !doc) {
    return <p className="text-slate-400">Loading document…</p>;
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-rose-400">{error ?? "Document not found"}</p>
        <Link href="/dashboard" className="text-teal-400 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-teal-400 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">{doc.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>Type: {doc.type}</span>
          <span>{statusBadge(doc.status)}</span>
          {live ? (
            <span className="text-slate-500">Live updates on</span>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Content
        </h2>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-200">
          {doc.content}
        </pre>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Processing snapshot
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Display name at processing</dt>
            <dd className="text-slate-200">
              {doc.processorDisplayName ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Last updated</dt>
            <dd className="text-slate-200">
              {new Date(doc.updatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
        <h3 className="mt-6 text-sm font-medium text-slate-400">Result</h3>
        {doc.result ? (
          <p className="mt-2 text-slate-200">{doc.result}</p>
        ) : (
          <p className="mt-2 text-slate-500">
            {doc.status === "FAILED"
              ? "Processing failed (e.g. empty content)."
              : "Not available yet."}
          </p>
        )}
      </section>
    </div>
  );
}

export default function DocumentDetailPage() {
  return (
    <AuthGate>
      <DocumentDetailContent />
    </AuthGate>
  );
}
