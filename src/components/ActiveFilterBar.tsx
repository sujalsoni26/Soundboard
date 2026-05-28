"use client";

import { X } from "lucide-react";
import { useSoundboard } from "@/hooks/use-soundboard";
import { cn } from "@/utils/cn";

export function ActiveFilterBar() {
  const {
    viewFilter,
    setViewFilter,
    activeCategory,
    setActiveCategory,
    activePlaylistId,
    playlists,
    selectPlaylist,
    searchQuery,
    setSearchQuery,
  } = useSoundboard();

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const chips: { key: string; label: string; onClear: () => void }[] = [];

  if (viewFilter === "favorites") chips.push({ key: "fav", label: "⭐ Favorites", onClear: () => setViewFilter("all") });
  if (viewFilter === "recent") chips.push({ key: "recent", label: "🕐 Recent", onClear: () => setViewFilter("all") });
  if (viewFilter === "trending") chips.push({ key: "trending", label: "🔥 Trending", onClear: () => setViewFilter("all") });
  if (viewFilter === "hidden") chips.push({ key: "hidden", label: "👁️‍🗨️ Hidden", onClear: () => setViewFilter("all") });
  if (viewFilter === "playlist" && activePlaylist) {
    chips.push({
      key: "playlist",
      label: `${activePlaylist.emoji} ${activePlaylist.name}`,
      onClear: () => selectPlaylist(null),
    });
  }
  if (activeCategory !== "All" && viewFilter !== "playlist" && viewFilter !== "hidden") {
    chips.push({ key: "cat", label: activeCategory, onClear: () => setActiveCategory("All") });
  }
  if (searchQuery.trim()) {
    chips.push({
      key: "search",
      label: `"${searchQuery.trim()}"`,
      onClear: () => setSearchQuery(""),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className={cn(
            "inline-flex max-w-full min-h-11 touch-manipulation items-center gap-1.5 rounded-full border border-[var(--accent-chip-border)]",
            "bg-[var(--accent-chip)] px-3 py-2 text-xs font-medium text-[var(--accent-chip-text)] active:opacity-90",
          )}
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 opacity-70" />
        </button>
      ))}
    </div>
  );
}
