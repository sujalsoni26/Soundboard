"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { buildSyncPayload } from "@/lib/build-sync-payload";
import { mergeSyncData, parseSyncData, readLocalSyncData } from "@/lib/sync-data";
import type { AppSettings, KeyboardShortcut, Playlist, Sound } from "@/types/sound";

const SAVE_DEBOUNCE_MS = 1500;

interface CloudSyncParams {
  favorites: Set<string>;
  hiddenSounds: Set<string>;
  customNames: Record<string, string>;
  playlists: Playlist[];
  recentIds: string[];
  playCounts: Record<string, number>;
  settings: AppSettings;
  shortcuts: KeyboardShortcut[];
  customSounds: Sound[];
  setFavorites: (value: Set<string>) => void;
  setHiddenSounds: (value: Set<string>) => void;
  setCustomNames: (value: Record<string, string>) => void;
  setPlaylists: (value: Playlist[]) => void;
  setRecentIds: (value: string[]) => void;
  setPlayCounts: (value: Record<string, number>) => void;
  setSettings: (value: AppSettings) => void;
  setShortcuts: (value: KeyboardShortcut[]) => void;
  setCustomSounds: (value: Sound[]) => void;
}

export function useCloudSync(params: CloudSyncParams) {
  const { user, configured } = useAuth();
  const syncedRef = useRef(false);
  const hydratingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled = configured && Boolean(user);

  useEffect(() => {
    syncedRef.current = false;
    hydratingRef.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!enabled || !user) return;

    let cancelled = false;

    const hydrate = async () => {
      hydratingRef.current = true;
      try {
        const res = await fetch("/api/sync");
        if (!res.ok || cancelled) return;

        const json = (await res.json()) as { data?: unknown };
        const remote = parseSyncData(json.data);
        const local = readLocalSyncData();
        const merged = mergeSyncData(local, remote);

        params.setFavorites(new Set(merged.favorites));
        params.setHiddenSounds(new Set(merged.hiddenSounds));
        params.setCustomNames(merged.customNames);
        params.setPlaylists(merged.playlists);
        params.setRecentIds(merged.recent);
        params.setPlayCounts(merged.playCounts);
        params.setSettings(merged.settings);
        params.setShortcuts(merged.shortcuts);
        params.setCustomSounds(merged.customSounds);

        if (!cancelled) {
          await fetch("/api/sync", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: merged }),
          });
          syncedRef.current = true;
        }
      } catch (error) {
        console.error("Cloud sync hydrate failed", error);
      } finally {
        hydratingRef.current = false;
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per login
  }, [enabled, user?.id]);

  useEffect(() => {
    if (!enabled || !syncedRef.current || hydratingRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const payload = buildSyncPayload({
        favorites: params.favorites,
        hiddenSounds: params.hiddenSounds,
        customNames: params.customNames,
        playlists: params.playlists,
        recentIds: params.recentIds,
        playCounts: params.playCounts,
        settings: params.settings,
        shortcuts: params.shortcuts,
        customSounds: params.customSounds,
      });

      void fetch("/api/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      }).catch((error) => console.error("Cloud sync save failed", error));
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    enabled,
    params.favorites,
    params.hiddenSounds,
    params.customNames,
    params.playlists,
    params.recentIds,
    params.playCounts,
    params.settings,
    params.shortcuts,
    params.customSounds,
  ]);
}
