import type { AppSettings, KeyboardShortcut, Playlist, Sound } from "@/types/sound";

/** Serializable personalization synced to Supabase */
export interface UserSyncData {
  favorites: string[];
  hiddenSounds: string[];
  customNames: Record<string, string>;
  playlists: Playlist[];
  recent: string[];
  playCounts: Record<string, number>;
  settings: AppSettings;
  shortcuts: KeyboardShortcut[];
  customSounds: Sound[];
}

export interface AdminSiteSettings {
  maintenanceMode: boolean;
  welcomeMessage: string;
  maxCustomSounds: number;
  trendingLimit: number;
  maxUploadBytes: number;
}

export interface UserProfile {
  id: string;
  email: string | null;
  role: "user" | "admin";
}
