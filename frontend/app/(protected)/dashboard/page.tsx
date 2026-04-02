"use client";

import Link from "next/link";
import { useState } from "react";
import { DocumentStatusBadge } from "@/components/DocumentStatusBadge";
import { SelectWithChevron } from "@/components/SelectWithChevron";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useDocuments } from "@/hooks/useDocuments";
import type { DocumentRecord, DocumentStatus, DocumentType } from "@/lib/types";

const STATUS_OPTIONS: { value: DocumentStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "QUEUED", label: "Queued" },
  { value: "PROCESSING", label: "Processing" },
  { value: "DONE", label: "Done" },
  { value: "FAILED", label: "Failed" },
];

const TYPE_OPTIONS: { value: DocumentType | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "invoice", label: "Invoice" },
  { value: "report", label: "Report" },
  { value: "contract", label: "Contract" },
];

export default function DashboardPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<DocumentStatus | "">("");
  const [type, setType] = useState<DocumentType | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { documents, loading, error, refetch } = useDocuments(token, {
    status: status || undefined,
    type: type || undefined,
    search: search || undefined,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [docType, setDocType] = useState<DocumentType>("invoice");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await apiFetch<DocumentRecord>("/documents", {
        method: "POST",
        token,
        body: JSON.stringify({ title, content, type: docType }),
      });
      setTitle("");
      setContent("");
      await refetch();
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not submit document",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Submit documents and track processing in real time.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-medium text-white">Submit document</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="text-slate-400">Title</span>
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-teal-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Type</span>
            <SelectWithChevron
              className="min-w-40 py-2 pl-3 pr-10 text-sm"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
            >
              <option value="invoice">invoice</option>
              <option value="report">report</option>
              <option value="contract">contract</option>
            </SelectWithChevron>
          </label>
          <div className="md:col-span-2" />
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="text-slate-400">Content</span>
            <textarea
              className="min-h-[120px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-teal-500"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </label>
          {submitError ? (
            <p className="text-sm text-rose-400 md:col-span-2">{submitError}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 disabled:opacity-50 md:col-span-2 md:w-fit"
          >
            {submitting ? "Submitting…" : "Submit & queue"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-lg font-medium text-white">Your documents</h2>
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-38 flex-col gap-1 text-xs text-slate-400">
              Status
              <SelectWithChevron
                className="py-1.5 pl-2 pr-9 text-sm"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as DocumentStatus | "")
                }
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectWithChevron>
            </label>
            <label className="flex min-w-38 flex-col gap-1 text-xs text-slate-400">
              Type
              <SelectWithChevron
                className="py-1.5 pl-2 pr-9 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType | "")}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectWithChevron>
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Search title
              <div className="flex gap-2">
                <input
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Filter…"
                />
                <button
                  type="button"
                  className="rounded-md border border-slate-600 px-2 py-1 text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() => setSearch(searchInput)}
                >
                  Apply
                </button>
              </div>
            </label>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-slate-400">Loading documents…</p>
        ) : error ? (
          <p className="mt-6 text-rose-400" role="alert">
            {error}
          </p>
        ) : documents.length === 0 ? (
          <p className="mt-6 text-slate-500">
            No documents yet. Submit one above.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Title</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/documents/${d.id}`}
                        className="font-medium text-teal-400 hover:underline"
                      >
                        {d.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{d.type}</td>
                    <td className="py-3 pr-4">
                      <DocumentStatusBadge status={d.status} />
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(d.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
