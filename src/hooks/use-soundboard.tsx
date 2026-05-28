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
import { useAuth } from "@/hooks/use-auth";
import { useCloudSync } from "@/hooks/use-cloud-sync";
import { applyApprovalToSyncData } from "@/lib/approval-cleanup";
import { buildSyncPayload } from "@/lib/build-sync-payload";
import { useLocalStorage, useLocalStorageSet } from "@/hooks/use-local-storage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { audioManager } from "@/lib/audio-manager";
import {
  DEFAULT_SETTINGS,
  MAX_CUSTOM_SOUNDS,
  MAX_PLAYLISTS,
  PRELOAD_BATCH_SIZE,
  STORAGE_KEYS,
  TRENDING_LIMIT,
} from "@/lib/constants";
import type { AppSettings, KeyboardShortcut, Playlist, Sound, SoundCategory } from "@/types/sound";
import { generateId, slugify, vibrate } from "@/utils/cn";
import { shareSound } from "@/utils/share-sound";
import { getItem, setItem } from "@/utils/storage";

export type ViewFilter = "all" | "favorites" | "recent" | "trending" | "playlist" | "hidden";

interface SoundboardContextValue {
  sounds: Sound[];
  filteredSounds: Sound[];
  catalogSource: "supabase" | "local" | "loading";
  refreshCatalog: () => Promise<void>;
  playlists: Playlist[];
  activePlaylistId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: SoundCategory | "All";
  setActiveCategory: (category: SoundCategory | "All") => void;
  viewFilter: ViewFilter;
  setViewFilter: (filter: ViewFilter) => void;
  selectPlaylist: (playlistId: string | null) => void;
  favorites: Set<string>;
  hiddenSounds: Set<string>;
  toggleFavorite: (soundId: string) => void;
  hideSound: (soundId: string) => void;
  unhideSound: (soundId: string) => void;
  isSoundHidden: (soundId: string) => boolean;
  visibleSoundCount: number;
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
  addPrivateSound: (sound: Sound) => void;
  removeCustomSound: (soundId: string) => void;
  renameSound: (soundId: string, title: string) => void;
  resetSoundName: (soundId: string) => void;
  getOriginalTitle: (soundId: string) => string;
  createPlaylist: (name: string, emoji?: string) => void;
  updatePlaylist: (playlistId: string, patch: Partial<Pick<Playlist, "name" | "emoji">>) => void;
  deletePlaylist: (playlistId: string) => void;
  addSoundToPlaylist: (playlistId: string, soundId: string) => void;
  removeSoundFromPlaylist: (playlistId: string, soundId: string) => void;
  isSoundInPlaylist: (playlistId: string, soundId: string) => boolean;
  clearFavorites: () => void;
  clearRecent: () => void;
  clearPlayCounts: () => void;
  getSoundBySlug: (slug: string) => Sound | undefined;
  shareSoundBySettings: (sound: Sound) => Promise<void>;
  playbackError: string | null;
  clearPlaybackError: () => void;
}

const SoundboardContext = createContext<SoundboardContextValue | null>(null);

function mergeSounds(catalog: Sound[], customSounds: Sound[]): Sound[] {
  const catalogIds = new Set(catalog.map((s) => s.id));
  const map = new Map<string, Sound>();
  catalog.forEach((s) => map.set(s.id, s));
  customSounds.forEach((s) => {
    if (catalogIds.has(s.id)) return;
    if (
      s.pendingApproval &&
      catalog.some((c) => c.title === s.title && c.emoji === s.emoji)
    ) {
      return;
    }
    map.set(s.id, s);
  });
  return Array.from(map.values());
}

function applyCustomNames(baseSounds: Sound[], customNames: Record<string, string>): Sound[] {
  return baseSounds.map((sound) => ({
    ...sound,
    title: customNames[sound.id]?.trim() || sound.title,
  }));
}

export function SoundboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [customSounds, setCustomSounds] = useLocalStorage<Sound[]>(
    STORAGE_KEYS.customSounds,
    [],
  );
  const [customNames, setCustomNames] = useLocalStorage<Record<string, string>>(
    STORAGE_KEYS.customNames,
    {},
  );
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>(STORAGE_KEYS.playlists, []);
  const [hiddenSounds, setHiddenSounds] = useLocalStorageSet(STORAGE_KEYS.hiddenSounds);
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

  const [catalogSounds, setCatalogSounds] = useState<Sound[]>(SAMPLE_SOUNDS);
  const [catalogSource, setCatalogSource] = useState<"supabase" | "local" | "loading">("loading");

  const syncStateRef = useRef({
    favorites,
    hiddenSounds,
    customNames,
    playlists,
    recentIds,
    playCounts,
    settings: mergedSettings,
    shortcuts,
    customSounds,
  });
  syncStateRef.current = {
    favorites,
    hiddenSounds,
    customNames,
    playlists,
    recentIds,
    playCounts,
    settings: mergedSettings,
    shortcuts,
    customSounds,
  };

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/sounds/catalog");
      if (!res.ok) return;
      const json = (await res.json()) as {
        sounds?: Sound[];
        source?: "supabase" | "local";
      };
      if (json.sounds?.length) {
        setCatalogSounds(json.sounds);
        setCatalogSource(json.source ?? "local");
      } else {
        setCatalogSource("local");
      }
    } catch (error) {
      console.error("loadCatalog", error);
      setCatalogSource("local");
    }
  }, []);

  const syncApprovalCleanups = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch("/api/sounds/approval-sync");
      if (!res.ok) return;

      const json = (await res.json()) as {
        approvals?: { privateSoundId: string; catalogSoundId: string }[];
      };
      const processed = new Set(getItem<string[]>(STORAGE_KEYS.processedApprovals, []));
      const approvals = (json.approvals ?? []).filter(
        (approval) => !processed.has(`${approval.privateSoundId}:${approval.catalogSoundId}`),
      );
      if (approvals.length === 0) return;

      const state = syncStateRef.current;
      const base = buildSyncPayload({
        favorites: state.favorites,
        hiddenSounds: state.hiddenSounds,
        customNames: state.customNames,
        playlists: state.playlists,
        recentIds: state.recentIds,
        playCounts: state.playCounts,
        settings: state.settings,
        shortcuts: state.shortcuts,
        customSounds: state.customSounds,
      });

      let data = base;
      for (const approval of approvals) {
        data = applyApprovalToSyncData(
          data,
          approval.privateSoundId,
          approval.catalogSoundId,
        );
      }

      if (JSON.stringify(data) === JSON.stringify(base)) {
        setItem(STORAGE_KEYS.processedApprovals, [
          ...processed,
          ...approvals.map((a) => `${a.privateSoundId}:${a.catalogSoundId}`),
        ]);
        return;
      }

      const removedIds = state.customSounds
        .filter((s) => !data.customSounds.some((next) => next.id === s.id))
        .map((s) => s.id);
      removedIds.forEach((id) => audioManager.unloadSound(id));

      setCustomSounds(data.customSounds);
      setFavorites(new Set(data.favorites));
      setHiddenSounds(new Set(data.hiddenSounds));
      setCustomNames(data.customNames);
      setPlaylists(data.playlists);
      setRecentIds(data.recent);
      setPlayCounts(data.playCounts);
      setShortcuts(data.shortcuts);

      setItem(STORAGE_KEYS.processedApprovals, [
        ...processed,
        ...approvals.map((a) => `${a.privateSoundId}:${a.catalogSoundId}`),
      ]);
    } catch (error) {
      console.error("syncApprovalCleanups", error);
    }
  }, [user, setCustomSounds, setFavorites, setHiddenSounds, setCustomNames, setPlaylists, setRecentIds, setPlayCounts, setShortcuts]);

  const refreshCatalog = useCallback(async () => {
    await loadCatalog();
    await syncApprovalCleanups();
  }, [loadCatalog, syncApprovalCleanups]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!user) return;
    void syncApprovalCleanups();
  }, [user?.id, syncApprovalCleanups]);

  useCloudSync({
    favorites,
    hiddenSounds,
    customNames,
    playlists,
    recentIds,
    playCounts,
    settings: mergedSettings,
    shortcuts,
    customSounds,
    setFavorites,
    setHiddenSounds,
    setCustomNames,
    setPlaylists,
    setRecentIds,
    setPlayCounts,
    setSettings,
    setShortcuts,
    setCustomSounds,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SoundCategory | "All">("All");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const preloadedRef = useRef(new Set<string>());

  const baseSounds = useMemo(() => mergeSounds(catalogSounds, customSounds), [catalogSounds, customSounds]);
  const sounds = useMemo(
    () => applyCustomNames(baseSounds, customNames),
    [baseSounds, customNames],
  );

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

  const hideSound = useCallback(
    (soundId: string) => {
      setHiddenSounds((prev) => new Set(prev).add(soundId));
      audioManager.stopSound(soundId);
      setPlayingIds((prev) => {
        if (!prev.has(soundId)) return prev;
        const next = new Set(prev);
        next.delete(soundId);
        return next;
      });
    },
    [setHiddenSounds],
  );

  const unhideSound = useCallback(
    (soundId: string) => {
      setHiddenSounds((prev) => {
        const next = new Set(prev);
        next.delete(soundId);
        return next;
      });
    },
    [setHiddenSounds],
  );

  const isSoundHidden = useCallback(
    (soundId: string) => hiddenSounds.has(soundId),
    [hiddenSounds],
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

    if (viewFilter === "hidden") {
      result = result.filter((s) => hiddenSounds.has(s.id));
    } else {
      result = result.filter((s) => !hiddenSounds.has(s.id));

      if (viewFilter === "favorites") {
        result = result.filter((s) => favorites.has(s.id));
      } else if (viewFilter === "recent") {
        result = recentIds
          .map((id) => sounds.find((s) => s.id === id))
          .filter((s): s is Sound => Boolean(s && !hiddenSounds.has(s.id)));
      } else if (viewFilter === "trending") {
        result = [...result]
          .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
          .slice(0, TRENDING_LIMIT);
      } else if (viewFilter === "playlist" && activePlaylistId) {
        const playlist = playlists.find((p) => p.id === activePlaylistId);
        if (playlist) {
          result = playlist.soundIds
            .map((id) => sounds.find((s) => s.id === id))
            .filter((s): s is Sound => Boolean(s && !hiddenSounds.has(s.id)));
        } else {
          result = [];
        }
      }
    }

    if (activeCategory !== "All" && viewFilter !== "playlist" && viewFilter !== "hidden") {
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
    hiddenSounds,
    favorites,
    recentIds,
    playCounts,
    activeCategory,
    searchQuery,
    activePlaylistId,
    playlists,
  ]);

  const visibleSoundCount = useMemo(
    () => sounds.filter((s) => !hiddenSounds.has(s.id)).length,
    [sounds, hiddenSounds],
  );

  const trendingSounds = useMemo(
    () =>
      [...sounds]
        .filter((s) => !hiddenSounds.has(s.id))
        .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
        .slice(0, TRENDING_LIMIT),
    [sounds, playCounts, hiddenSounds],
  );

  const playRandom = useCallback(
    (fromCategory = false) => {
      const visible = sounds.filter((s) => !hiddenSounds.has(s.id));
      const pool =
        fromCategory && activeCategory !== "All"
          ? visible.filter((s) => s.category === activeCategory)
          : filteredSounds.length > 0
            ? filteredSounds
            : visible;
      if (pool.length === 0) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      playSound(pick);
    },
    [activeCategory, filteredSounds, sounds, hiddenSounds, playSound],
  );

  const addPrivateSound = useCallback(
    (sound: Sound) => {
      setCustomSounds((prev) => {
        const next = [sound, ...prev.filter((s) => s.id !== sound.id)].slice(0, MAX_CUSTOM_SOUNDS);
        audioManager.preloadSound(sound);
        return next;
      });
    },
    [setCustomSounds],
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
        const next = [sound, ...prev].slice(0, MAX_CUSTOM_SOUNDS);
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

  const getOriginalTitle = useCallback(
    (soundId: string) => baseSounds.find((s) => s.id === soundId)?.title ?? "",
    [baseSounds],
  );

  const renameSound = useCallback(
    (soundId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setCustomNames((prev) => ({ ...prev, [soundId]: trimmed }));
    },
    [setCustomNames],
  );

  const resetSoundName = useCallback(
    (soundId: string) => {
      setCustomNames((prev) => {
        const next = { ...prev };
        delete next[soundId];
        return next;
      });
    },
    [setCustomNames],
  );

  const createPlaylist = useCallback(
    (name: string, emoji = "📁") => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const playlist: Playlist = {
        id: generateId(),
        name: trimmed,
        emoji: emoji || "📁",
        soundIds: [],
        createdAt: Date.now(),
      };
      setPlaylists((prev) => [playlist, ...prev].slice(0, MAX_PLAYLISTS));
    },
    [setPlaylists],
  );

  const updatePlaylist = useCallback(
    (playlistId: string, patch: Partial<Pick<Playlist, "name" | "emoji">>) => {
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, ...patch } : p)),
      );
    },
    [setPlaylists],
  );

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      setActivePlaylistId((current) => (current === playlistId ? null : current));
      setViewFilter((current) => (current === "playlist" ? "all" : current));
    },
    [setPlaylists],
  );

  const addSoundToPlaylist = useCallback(
    (playlistId: string, soundId: string) => {
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId && !p.soundIds.includes(soundId)
            ? { ...p, soundIds: [...p.soundIds, soundId] }
            : p,
        ),
      );
    },
    [setPlaylists],
  );

  const removeSoundFromPlaylist = useCallback(
    (playlistId: string, soundId: string) => {
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? { ...p, soundIds: p.soundIds.filter((id) => id !== soundId) }
            : p,
        ),
      );
    },
    [setPlaylists],
  );

  const isSoundInPlaylist = useCallback(
    (playlistId: string, soundId: string) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      return playlist?.soundIds.includes(soundId) ?? false;
    },
    [playlists],
  );

  const selectPlaylist = useCallback((playlistId: string | null) => {
    setActivePlaylistId(playlistId);
    setViewFilter(playlistId ? "playlist" : "all");
  }, []);

  const handleSetViewFilter = useCallback((filter: ViewFilter) => {
    setViewFilter(filter);
    if (filter !== "playlist") setActivePlaylistId(null);
    if (filter === "hidden" || filter === "playlist") setActiveCategory("All");
  }, []);

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
    catalogSource,
    refreshCatalog,
    playlists,
    activePlaylistId,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    viewFilter,
    setViewFilter: handleSetViewFilter,
    selectPlaylist,
    favorites,
    hiddenSounds,
    toggleFavorite,
    hideSound,
    unhideSound,
    isSoundHidden,
    visibleSoundCount,
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
    addPrivateSound,
    removeCustomSound,
    renameSound,
    resetSoundName,
    getOriginalTitle,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSoundToPlaylist,
    removeSoundFromPlaylist,
    isSoundInPlaylist,
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!isDesktop) return;

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
  }, [isDesktop, shortcuts, sounds, playSound]);
}
