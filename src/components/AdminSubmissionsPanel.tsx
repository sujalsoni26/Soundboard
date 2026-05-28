"use client";

import { useCallback, useEffect, useState } from "react";
import type { SoundSubmission } from "@/types/catalog";

export function AdminSubmissionsPanel() {
  const [submissions, setSubmissions] = useState<SoundSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/submissions?status=pending");
      const json = (await res.json()) as { submissions?: SoundSubmission[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not load submissions.");
      setSubmissions(json.submissions ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/submissions?status=pending");
        if (!active) return;
        const json = (await res.json()) as { submissions?: SoundSubmission[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Could not load submissions.");
        setSubmissions(json.submissions ?? []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load submissions.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const review = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}/${action}`, { method: "POST" });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Action failed.");
      setMessage(json.message ?? "Done.");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-card-border bg-modal p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pending uploads</h2>
          <p className="text-sm text-muted">Approve to add to the public catalog on Supabase.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-11 touch-manipulation rounded-xl border border-card-border px-3 py-2 text-xs text-foreground active:bg-surface-hover"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
      {message && <p className="text-sm text-accent-text">{message}</p>}

      {!loading && submissions.length === 0 && (
        <p className="text-sm text-muted">No pending uploads.</p>
      )}

      <ul className="space-y-3">
        {submissions.map((submission) => (
          <li
            key={submission.id}
            className="rounded-xl border border-card-border bg-surface p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {submission.emoji} {submission.title}
                </p>
                <p className="text-xs text-muted">
                  {submission.category} · {submission.uploaderEmail ?? submission.user_id}
                </p>
                {submission.tags?.length > 0 && (
                  <p className="mt-1 text-xs text-muted">{submission.tags.join(", ")}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyId === submission.id}
                  onClick={() => void review(submission.id, "approve")}
                  className="min-h-11 touch-manipulation rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-60 active:opacity-90"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === submission.id}
                  onClick={() => void review(submission.id, "reject")}
                  className="min-h-11 touch-manipulation rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-600 active:bg-red-500/25 dark:text-red-300 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
            <audio controls preload="none" src={submission.file_url} className="mt-2 h-10 w-full sm:h-8" />
          </li>
        ))}
      </ul>
    </div>
  );
}
