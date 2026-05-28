"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminCatalogPanel } from "@/components/AdminCatalogPanel";
import { AdminSubmissionsPanel } from "@/components/AdminSubmissionsPanel";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/hooks/use-auth";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import type { AdminSiteSettings } from "@/types/sync";

const inputClassName =
  "w-full rounded-xl border border-card-border bg-input px-3 py-2 text-sm text-foreground";

export default function AdminPage() {
  const { user, profile, loading, isAdmin, configured, refreshAuth } = useAuth();
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json: { site?: AdminSiteSettings }) => setSite(json.site ?? null))
      .catch(() => setError("Could not load settings."));
  }, []);

  if (!configured) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-muted">Supabase is not configured.</p>
        <Link href="/" className="mt-4 inline-block text-violet-500">
          Back to soundboard
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="px-4 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] text-center text-muted">
        <p>Loading…</p>
        <p className="mt-2 text-xs">If this takes more than a few seconds, try signing in from the home page.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-violet-500">
          ← Back to soundboard
        </Link>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] text-center">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-muted">Sign in to access admin settings.</p>
        <div className="mt-6 flex justify-center">
          <AuthButton />
        </div>
        <Link href="/" className="mt-6 inline-block text-violet-500">
          Back to soundboard
        </Link>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-muted">Your account does not have admin privileges.</p>
        {profile?.email && (
          <p className="mt-2 text-xs text-muted">
            Signed in as {profile.email} (role: {profile.role})
          </p>
        )}
        <button
          type="button"
          onClick={() => void refreshAuth()}
          className="mt-4 min-h-11 touch-manipulation rounded-xl border border-card-border px-4 py-2.5 text-sm text-foreground active:bg-surface-hover"
        >
          Refresh session
        </button>
        <Link href="/" className="mt-4 block text-violet-500">
          Back to soundboard
        </Link>
      </main>
    );
  }

  const handleSave = async () => {
    if (!site) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site }),
      });
      const json = (await res.json()) as { site?: AdminSiteSettings; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSite(json.site ?? site);
      setMessage("Settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(5rem,env(safe-area-inset-bottom))]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted">Site-wide settings</p>
        </div>
        <Link href="/" className="text-sm text-violet-500">
          ← Soundboard
        </Link>
      </div>

      {site && (
        <div className="space-y-5 rounded-2xl border border-card-border bg-modal p-5">
          <label className="flex items-center justify-between gap-3 text-sm">
            Maintenance mode
            <input
              type="checkbox"
              checked={site.maintenanceMode}
              onChange={(e) => setSite({ ...site, maintenanceMode: e.target.checked })}
              className="h-5 w-5 accent-violet-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Welcome message</span>
            <textarea
              value={site.welcomeMessage}
              onChange={(e) => setSite({ ...site, welcomeMessage: e.target.value })}
              rows={3}
              placeholder="Shown on the home page when set"
              className={inputClassName}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Max custom sounds per user</span>
            <input
              type="number"
              min={1}
              max={100}
              value={site.maxCustomSounds}
              onChange={(e) => setSite({ ...site, maxCustomSounds: Number(e.target.value) })}
              className={inputClassName}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Trending section limit</span>
            <input
              type="number"
              min={4}
              max={20}
              value={site.trendingLimit}
              onChange={(e) => setSite({ ...site, trendingLimit: Number(e.target.value) })}
              className={inputClassName}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Max upload size (MB)</span>
            <input
              type="number"
              min={1}
              max={10}
              value={Math.round((site.maxUploadBytes ?? MAX_UPLOAD_BYTES) / (1024 * 1024))}
              onChange={(e) =>
                setSite({
                  ...site,
                  maxUploadBytes: Number(e.target.value) * 1024 * 1024,
                })
              }
              className={inputClassName}
            />
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          {message && <p className="text-sm text-accent-text">{message}</p>}

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="w-full min-h-11 touch-manipulation rounded-xl bg-violet-500 py-2.5 text-sm font-medium text-white disabled:opacity-60 active:opacity-90"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}

      <AdminSubmissionsPanel />
      <AdminCatalogPanel />
    </main>
  );
}
