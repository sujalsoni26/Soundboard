"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SAMPLE_SOUNDS } from "@/data/sounds";
import { useLocalStorage, useLocalStorageSet } from "@/hooks/use-local-storage";
import { audioManager } from "@/lib/audio-manager";
import {
  DEFAULT_SETTINGS,
  PRELOAD_BATCH_SIZE,
  STORAGE_KEYS,
  TRENDING_LIMIT,
} from "@/lib/constants";
import type { AppSettings, KeyboardShortcut, Sound, SoundCategory } from "@/types/sound";
import { generateId, slugify, vibrate } from "@/utils/cn";
import { shareSound } from "@/utils/share-sound";

export type ViewFilter = "all" | "favorites" | "recent" | "trending";

interface SoundboardContextValue {
  sounds: Sound[];
  filteredSounds: Sound[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: SoundCategory | "All";
  setActiveCategory: (category: SoundCategory | "All") => void;
  viewFilter: ViewFilter;
  setViewFilter: (filter: ViewFilter) => void;
  favorites: Set<string>;
  toggleFavorite: (soundId: string) => void;
  recentIds: string[];
  playCounts: Record<string, number>;
  trendingSounds: Sound[];
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  shortcuts: KeyboardShortcut[];
  setShortcut: (soundId: string, key: string) => void;
  removeShortcut: (soundId: string) => void;
  playingIds: Set<string>;
  isSoundPlaying: (soundId: string) => boolean;
  toggleSound: (sound: Sound) => void;
  playSound: (sound: Sound) => void;
  stopAllSounds: () => void;
  playRandom: (fromCategory?: boolean) => void;
  addCustomSound: (sound: Omit<Sound, "id" | "slug" | "isCustom" | "createdAt">) => void;
  removeCustomSound: (soundId: string) => void;
  clearFavorites: () => void;
  clearRecent: () => void;
  clearPlayCounts: () => void;
  getSoundBySlug: (slug: string) => Sound | undefined;
  shareSoundBySettings: (sound: Sound) => Promise<void>;
  playbackError: string | null;
  clearPlaybackError: () => void;
}

const SoundboardContext = createContext<SoundboardContextValue | null>(null);

function mergeSounds(customSounds: Sound[]): Sound[] {
  const map = new Map<string, Sound>();
  SAMPLE_SOUNDS.forEach((s) => map.set(s.id, s));
  customSounds.forEach((s) => map.set(s.id, s));
  return Array.from(map.values());
}

export function SoundboardProvider({ children }: { children: ReactNode }) {
  const [customSounds, setCustomSounds] = useLocalStorage<Sound[]>(
    STORAGE_KEYS.customSounds,
    [],
  );
  const [favorites, setFavorites] = useLocalStorageSet(STORAGE_KEYS.favorites);
  const [recentIds, setRecentIds] = useLocalStorage<string[]>(STORAGE_KEYS.recent, []);
  const [playCounts, setPlayCounts] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.playCounts,
    {},
  );
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS,
  );
  const mergedSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...settings }),
    [settings],
  );
  const [shortcuts, setShortcuts] = useLocalStorage<KeyboardShortcut[]>(
    STORAGE_KEYS.shortcuts,
    [],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SoundCategory | "All">("All");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const preloadedRef = useRef(new Set<string>());

  const sounds = useMemo(() => mergeSounds(customSounds), [customSounds]);

  useEffect(() => {
    audioManager.setVolume(mergedSettings.volume);
    audioManager.setOverlapMode(mergedSettings.overlapMode);
    document.documentElement.classList.toggle("dark", mergedSettings.theme === "dark");
  }, [mergedSettings.volume, mergedSettings.overlapMode, mergedSettings.theme]);

  useEffect(() => {
    const batch = sounds.slice(0, PRELOAD_BATCH_SIZE);
    batch.forEach((sound) => {
      if (!preloadedRef.current.has(sound.id)) {
        audioManager.preloadSound(sound);
        preloadedRef.current.add(sound.id);
      }
    });

    let index = PRELOAD_BATCH_SIZE;
    const idlePreload = () => {
      const chunk = sounds.slice(index, index + PRELOAD_BATCH_SIZE);
      if (chunk.length === 0) return;
      chunk.forEach((sound) => {
        if (!preloadedRef.current.has(sound.id)) {
          audioManager.preloadSound(sound);
          preloadedRef.current.add(sound.id);
        }
      });
      index += PRELOAD_BATCH_SIZE;
      if (index < sounds.length) {
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(idlePreload);
        } else {
          setTimeout(idlePreload, 100);
        }
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(idlePreload);
    } else {
      setTimeout(idlePreload, 200);
    }
  }, [sounds]);

  useEffect(() => {
    audioManager.onPlay((soundId) => {
      setPlayingIds((prev) => new Set(prev).add(soundId));

      setPlayCounts((prev) => ({ ...prev, [soundId]: (prev[soundId] ?? 0) + 1 }));

      setRecentIds((prev) =>
        [soundId, ...prev.filter((id) => id !== soundId)].slice(0, mergedSettings.maxRecent),
      );
    });

    audioManager.onStop((soundId) => {
      setPlayingIds((prev) => {
        if (!prev.has(soundId)) return prev;
        const next = new Set(prev);
        next.delete(soundId);
        return next;
      });
    });

    audioManager.onError((_soundId, error) => {
      setPlaybackError("Could not play this sound. The file may be missing or unsupported.");
      console.error(error);
    });

    return () => {
      audioManager.onPlay(() => {});
      audioManager.onStop(() => {});
      audioManager.onError(() => {});
    };
  }, [mergedSettings.maxRecent, setPlayCounts, setRecentIds]);

  useEffect(() => () => audioManager.destroy(), []);

  const toggleFavorite = useCallback(
    (soundId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(soundId)) next.delete(soundId);
        else next.add(soundId);
        return next;
      });
    },
    [setFavorites],
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [setSettings],
  );

  const playSound = useCallback(
    (sound: Sound) => {
      audioManager.playSound(sound.id, sound.file);
      if (mergedSettings.vibrationEnabled) vibrate(12);
    },
    [mergedSettings.vibrationEnabled],
  );

  const toggleSound = useCallback(
    (sound: Sound) => {
      if (audioManager.isPlaying(sound.id)) {
        audioManager.stopSound(sound.id);
        return;
      }
      playSound(sound);
    },
    [playSound],
  );

  const isSoundPlaying = useCallback(
    (soundId: string) => playingIds.has(soundId),
    [playingIds],
  );

  const stopAllSounds = useCallback(() => {
    audioManager.stopAllSounds();
    setPlayingIds(new Set());
  }, []);

  const filteredSounds = useMemo(() => {
    let result = sounds;

    if (viewFilter === "favorites") {
      result = result.filter((s) => favorites.has(s.id));
    } else if (viewFilter === "recent") {
      result = recentIds
        .map((id) => sounds.find((s) => s.id === id))
        .filter((s): s is Sound => Boolean(s));
    } else if (viewFilter === "trending") {
      result = [...sounds]
        .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
        .slice(0, TRENDING_LIMIT);
    }

    if (activeCategory !== "All") {
      result = result.filter((s) => s.category === activeCategory);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return result;
  }, [
    sounds,
    viewFilter,
    favorites,
    recentIds,
    playCounts,
    activeCategory,
    searchQuery,
  ]);

  const trendingSounds = useMemo(
    () =>
      [...sounds]
        .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
        .slice(0, TRENDING_LIMIT),
    [sounds, playCounts],
  );

  const playRandom = useCallback(
    (fromCategory = false) => {
      const pool =
        fromCategory && activeCategory !== "All"
          ? sounds.filter((s) => s.category === activeCategory)
          : filteredSounds.length > 0
            ? filteredSounds
            : sounds;
      if (pool.length === 0) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      playSound(pick);
    },
    [activeCategory, filteredSounds, sounds, playSound],
  );

  const addCustomSound = useCallback(
    (input: Omit<Sound, "id" | "slug" | "isCustom" | "createdAt">) => {
      const slug = slugify(input.title);
      const sound: Sound = {
        ...input,
        id: generateId(),
        slug: `${slug}-${Date.now().toString(36)}`,
        isCustom: true,
        createdAt: Date.now(),
        category: "Custom",
      };
      setCustomSounds((prev) => {
        const next = [sound, ...prev].slice(0, 50);
        audioManager.preloadSound(sound);
        return next;
      });
    },
    [setCustomSounds],
  );

  const removeCustomSound = useCallback(
    (soundId: string) => {
      setCustomSounds((prev) => {
        audioManager.unloadSound(soundId);
        return prev.filter((s) => s.id !== soundId);
      });
    },
    [setCustomSounds],
  );

  const setShortcut = useCallback(
    (soundId: string, key: string) => {
      const normalized = key.toLowerCase();
      setShortcuts((prev) => [
        ...prev.filter((s) => s.soundId !== soundId && s.key !== normalized),
        { soundId, key: normalized },
      ]);
    },
    [setShortcuts],
  );

  const removeShortcut = useCallback(
    (soundId: string) => {
      setShortcuts((prev) => prev.filter((s) => s.soundId !== soundId));
    },
    [setShortcuts],
  );

  const clearFavorites = useCallback(() => setFavorites(new Set()), [setFavorites]);
  const clearRecent = useCallback(() => setRecentIds([]), [setRecentIds]);
  const clearPlayCounts = useCallback(() => setPlayCounts({}), [setPlayCounts]);

  const getSoundBySlug = useCallback(
    (slug: string) => sounds.find((s) => s.slug === slug),
    [sounds],
  );

  const shareSoundBySettings = useCallback(
    async (sound: Sound) => {
      try {
        await shareSound(sound, mergedSettings.shareMode);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setPlaybackError("Could not share this sound.");
        console.error(error);
      }
    },
    [mergedSettings.shareMode],
  );

  const value: SoundboardContextValue = {
    sounds,
    filteredSounds,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    viewFilter,
    setViewFilter,
    favorites,
    toggleFavorite,
    recentIds,
    playCounts,
    trendingSounds,
    settings: mergedSettings,
    updateSettings,
    shortcuts,
    setShortcut,
    removeShortcut,
    playingIds,
    isSoundPlaying,
    toggleSound,
    playSound,
    stopAllSounds,
    playRandom,
    addCustomSound,
    removeCustomSound,
    clearFavorites,
    clearRecent,
    clearPlayCounts,
    getSoundBySlug,
    shareSoundBySettings,
    playbackError,
    clearPlaybackError: () => setPlaybackError(null),
  };

  return (
    <SoundboardContext.Provider value={value}>{children}</SoundboardContext.Provider>
  );
}

export function useSoundboard() {
  const ctx = useContext(SoundboardContext);
  if (!ctx) throw new Error("useSoundboard must be used within SoundboardProvider");
  return ctx;
}

export function useKeyboardShortcuts() {
  const { shortcuts, sounds, playSound } = useSoundboard();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      const shortcut = shortcuts.find((s) => s.key === key);
      if (!shortcut) return;

      e.preventDefault();
      const sound = sounds.find((s) => s.id === shortcut.soundId);
      if (sound) playSound(sound);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, sounds, playSound]);
}
