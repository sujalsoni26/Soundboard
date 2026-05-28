import type { AppSettings, KeyboardShortcut, Playlist, Sound } from "@/types/sound";
import type { UserSyncData } from "@/types/sync";

export function buildSyncPayload(state: {
  favorites: Set<string>;
  hiddenSounds: Set<string>;
  customNames: Record<string, string>;
  playlists: Playlist[];
  recentIds: string[];
  playCounts: Record<string, number>;
  settings: AppSettings;
  shortcuts: KeyboardShortcut[];
  customSounds: Sound[];
}): UserSyncData {
  return {
    favorites: Array.from(state.favorites),
    hiddenSounds: Array.from(state.hiddenSounds),
    customNames: state.customNames,
    playlists: state.playlists,
    recent: state.recentIds,
    playCounts: state.playCounts,
    settings: state.settings,
    shortcuts: state.shortcuts,
    customSounds: state.customSounds,
  };
}
