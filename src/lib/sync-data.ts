import { DEFAULT_SETTINGS, STORAGE_KEYS } from "@/lib/constants";
import type { UserSyncData } from "@/types/sync";
import type { AppSettings, KeyboardShortcut, Playlist, Sound } from "@/types/sound";
import { getItem } from "@/utils/storage";

export function emptySyncData(): UserSyncData {
  return {
    favorites: [],
    hiddenSounds: [],
    customNames: {},
    playlists: [],
    recent: [],
    playCounts: {},
    settings: DEFAULT_SETTINGS,
    shortcuts: [],
    customSounds: [],
  };
}

export function readLocalSyncData(): UserSyncData {
  const favorites = getItem<string[]>(STORAGE_KEYS.favorites, []);
  const hiddenSounds = getItem<string[]>(STORAGE_KEYS.hiddenSounds, []);
  const customNames = getItem<Record<string, string>>(STORAGE_KEYS.customNames, {});
  const playlists = getItem<Playlist[]>(STORAGE_KEYS.playlists, []);
  const recent = getItem<string[]>(STORAGE_KEYS.recent, []);
  const playCounts = getItem<Record<string, number>>(STORAGE_KEYS.playCounts, {});
  const settings = { ...DEFAULT_SETTINGS, ...getItem<Partial<AppSettings>>(STORAGE_KEYS.settings, {}) };
  const shortcuts = getItem<KeyboardShortcut[]>(STORAGE_KEYS.shortcuts, []);
  const customSounds = getItem<Sound[]>(STORAGE_KEYS.customSounds, []);

  return {
    favorites,
    hiddenSounds,
    customNames,
    playlists,
    recent,
    playCounts,
    settings,
    shortcuts,
    customSounds,
  };
}

export function mergeSyncData(local: UserSyncData, remote: UserSyncData): UserSyncData {
  const hasRemote =
    remote.favorites.length > 0 ||
    remote.hiddenSounds.length > 0 ||
    Object.keys(remote.customNames).length > 0 ||
    remote.playlists.length > 0 ||
    remote.customSounds.length > 0;

  if (!hasRemote) return local;

  const hasLocal =
    local.favorites.length > 0 ||
    local.hiddenSounds.length > 0 ||
    Object.keys(local.customNames).length > 0 ||
    local.playlists.length > 0 ||
    local.customSounds.length > 0;

  if (!hasLocal) return remote;

  return {
    favorites: [...new Set([...remote.favorites, ...local.favorites])],
    hiddenSounds: [...new Set([...remote.hiddenSounds, ...local.hiddenSounds])],
    customNames: { ...remote.customNames, ...local.customNames },
    playlists: local.playlists.length >= remote.playlists.length ? local.playlists : remote.playlists,
    recent: local.recent.length > 0 ? local.recent : remote.recent,
    playCounts: { ...remote.playCounts, ...local.playCounts },
    settings: { ...remote.settings, ...local.settings },
    shortcuts: local.shortcuts.length >= remote.shortcuts.length ? local.shortcuts : remote.shortcuts,
    customSounds: [...remote.customSounds, ...local.customSounds].slice(0, 50),
  };
}

export function parseSyncData(raw: unknown): UserSyncData {
  const base = emptySyncData();
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Record<string, unknown>;
  return {
    favorites: Array.isArray(d.favorites) ? (d.favorites as string[]) : base.favorites,
    hiddenSounds: Array.isArray(d.hiddenSounds) ? (d.hiddenSounds as string[]) : base.hiddenSounds,
    customNames: typeof d.customNames === "object" && d.customNames ? (d.customNames as Record<string, string>) : base.customNames,
    playlists: Array.isArray(d.playlists) ? (d.playlists as Playlist[]) : base.playlists,
    recent: Array.isArray(d.recent) ? (d.recent as string[]) : base.recent,
    playCounts: typeof d.playCounts === "object" && d.playCounts ? (d.playCounts as Record<string, number>) : base.playCounts,
    settings: { ...base.settings, ...(typeof d.settings === "object" && d.settings ? d.settings : {}) } as AppSettings,
    shortcuts: Array.isArray(d.shortcuts) ? (d.shortcuts as KeyboardShortcut[]) : base.shortcuts,
    customSounds: Array.isArray(d.customSounds) ? (d.customSounds as Sound[]) : base.customSounds,
  };
}
