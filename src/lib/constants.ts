import type { AppSettings, SoundCategory } from "@/types/sound";

export const STORAGE_KEYS = {
  favorites: "soundboard:favorites",
  recent: "soundboard:recent",
  playCounts: "soundboard:playCounts",
  customSounds: "soundboard:customSounds",
  shortcuts: "soundboard:shortcuts",
  settings: "soundboard:settings",
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  volume: 0.85,
  overlapMode: "overlap",
  shareMode: "mp3",
  autoplayOnShare: true,
  vibrationEnabled: true,
  maxRecent: 20,
  theme: "dark",
};

export const CATEGORIES: SoundCategory[] = [
  "Classic",
  "Bollywood",
  "Gaming",
  "Anime",
  "Sigma",
  "Brainrot",
  "Sound Effects",
  "Custom",
];

export const CATEGORY_EMOJI: Record<SoundCategory, string> = {
  Classic: "🎭",
  Bollywood: "🎬",
  Gaming: "🎮",
  Anime: "⛩️",
  Sigma: "🗿",
  Brainrot: "🧠",
  "Sound Effects": "🔊",
  Custom: "📁",
};

export const MAX_CUSTOM_SOUNDS = 50;
export const PRELOAD_BATCH_SIZE = 8;
export const TRENDING_LIMIT = 8;

export const SITE_LOGO = "/icons/soundboard logo.png";
export const FAVICON = "/favicon.png";
