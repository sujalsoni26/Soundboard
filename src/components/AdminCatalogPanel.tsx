"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminCatalogSound } from "@/types/catalog";
import { cn } from "@/utils/cn";

const adminActionClass =
  "min-h-11 touch-manipulation rounded-lg px-3 py-2 text-xs disabled:opacity-60 active:opacity-90";

type VisibilityFilter = "all" | "visible" | "hidden";

export function AdminCatalogPanel() {
  const [sounds, setSounds] = useState<AdminCatalogSound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VisibilityFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/catalog");
      const json = (await res.json()) as { sounds?: AdminCatalogSound[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not load catalog.");
      setSounds(json.sounds ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSounds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sounds.filter((sound) => {
      if (filter === "visible" && !sound.isActive) return false;
      if (filter === "hidden" && sound.isActive) return false;
      if (!normalizedQuery) return true;
      return (
        sound.title.toLowerCase().includes(normalizedQuery) ||
        sound.category.toLowerCase().includes(normalizedQuery) ||
        sound.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filter, query, sounds]);

  const setActive = async (sound: AdminCatalogSound, isActive: boolean) => {
    setBusyId(sound.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/catalog/${encodeURIComponent(sound.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = (await res.json()) as { message?: string; error?: string; isActive?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Update failed.");
      setSounds((prev) =>
        prev.map((item) => (item.id === sound.id ? { ...item, isActive: json.isActive ?? isActive } : item)),
      );
      setMessage(json.message ?? "Updated.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (sound: AdminCatalogSound) => {
    const prompt =
      sound.source === "supabase"
        ? `Permanently delete "${sound.title}" from the global catalog? This cannot be undone.`
        : `Hide "${sound.title}" globally? Bundled sounds cannot be deleted from the app bundle.`;
    if (!window.confirm(prompt)) return;

    setBusyId(sound.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/catalog/${encodeURIComponent(sound.id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { message?: string; error?: string; source?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed.");
      if (json.source === "supabase") {
        setSounds((prev) => prev.filter((item) => item.id !== sound.id));
      } else {
        setSounds((prev) =>
          prev.map((item) => (item.id === sound.id ? { ...item, isActive: false } : item)),
        );
      }
      setMessage(json.message ?? "Done.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const hiddenCount = sounds.filter((sound) => !sound.isActive).length;

  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-card-border bg-modal p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Catalog sounds</h2>
          <p className="text-sm text-muted">
            Hide or delete sounds for everyone. Hidden sounds disappear from the public catalog.
          </p>
          {!loading && (
            <p className="mt-1 text-xs text-muted">
              {sounds.length} total · {hiddenCount} hidden
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-11 touch-manipulation rounded-xl border border-card-border px-3 py-2 text-xs text-foreground active:bg-surface-hover"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, category, or id…"
          className="w-full min-h-11 rounded-xl border border-card-border bg-input px-3 py-2.5 text-base text-foreground sm:text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as VisibilityFilter)}
          className="min-h-11 rounded-xl border border-card-border bg-input px-3 py-2.5 text-base text-foreground sm:text-sm"
        >
          <option value="all">All sounds</option>
          <option value="visible">Visible only</option>
          <option value="hidden">Hidden only</option>
        </select>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
      {message && <p className="text-sm text-accent-text">{message}</p>}

      {!loading && filteredSounds.length === 0 && (
        <p className="text-sm text-muted">No sounds match your filters.</p>
      )}

      <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
        {filteredSounds.map((sound) => (
          <li
            key={sound.id}
            className="rounded-xl border border-card-border bg-surface p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {sound.emoji} {sound.title}
                  {!sound.isActive && (
                    <span className="ml-2 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                      Hidden
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {sound.category} · {sound.source === "supabase" ? "Supabase" : "Bundled"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {sound.isActive ? (
                  <button
                    type="button"
                    disabled={busyId === sound.id}
                    onClick={() => void setActive(sound, false)}
                    className={cn(adminActionClass, "border border-card-border text-foreground")}
                  >
                    Hide
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === sound.id}
                    onClick={() => void setActive(sound, true)}
                    className={cn(adminActionClass, "bg-violet-500 font-medium text-white")}
                  >
                    Unhide
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === sound.id}
                  onClick={() => void remove(sound)}
                  className={cn(adminActionClass, "bg-red-500/15 text-red-600 dark:text-red-300")}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
