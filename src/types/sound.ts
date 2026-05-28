export type SoundCategory =
  | "Classic"
  | "Bollywood"
  | "Gaming"
  | "Anime"
  | "Sigma"
  | "Brainrot"
  | "Sound Effects"
  | "Custom";

export type OverlapMode = "single" | "overlap" | "queue";

export type ShareMode = "mp3" | "link";

export interface Sound {
  id: string;
  slug: string;
  title: string;
  file: string;
  category: SoundCategory;
  tags: string[];
  emoji: string;
  duration: number;
  favorite?: boolean;
  playCount?: number;
  isCustom?: boolean;
  createdAt?: number;
}

export interface AppSettings {
  volume: number;
  overlapMode: OverlapMode;
  shareMode: ShareMode;
  autoplayOnShare: boolean;
  vibrationEnabled: boolean;
  maxRecent: number;
  theme: "dark" | "light";
}

export interface KeyboardShortcut {
  soundId: string;
  key: string;
}

export interface StoredState {
  favorites: string[];
  recent: string[];
  playCounts: Record<string, number>;
  customSounds: Sound[];
  shortcuts: KeyboardShortcut[];
  settings: AppSettings;
}
