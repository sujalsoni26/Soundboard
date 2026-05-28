"use client";

import { motion } from "framer-motion";
import { CATEGORY_EMOJI, CATEGORIES } from "@/lib/constants";
import { useSoundboard } from "@/hooks/use-soundboard";
import type { SoundCategory } from "@/types/sound";
import { cn } from "@/utils/cn";

const FILTERS = [
  { id: "all" as const, label: "All", emoji: "🎵" },
  { id: "favorites" as const, label: "Favorites", emoji: "⭐" },
  { id: "recent" as const, label: "Recent", emoji: "🕐" },
  { id: "trending" as const, label: "Trending", emoji: "🔥" },
];

export function CategoryTabs() {
  const {
    activeCategory,
    setActiveCategory,
    viewFilter,
    setViewFilter,
    playlists,
    activePlaylistId,
    selectPlaylist,
  } = useSoundboard();

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setViewFilter(filter.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
              viewFilter === filter.id
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                : "bg-surface text-foreground/80 hover:bg-surface-hover",
            )}
          >
            {filter.emoji} {filter.label}
          </button>
        ))}
      </div>

      {playlists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {playlists.map((playlist) => (
            <motion.button
              key={playlist.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                activePlaylistId === playlist.id && viewFilter === "playlist"
                  ? selectPlaylist(null)
                  : selectPlaylist(playlist.id)
              }
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                viewFilter === "playlist" && activePlaylistId === playlist.id
                  ? "border-[var(--accent-chip-border)] bg-[var(--accent-chip)] text-[var(--accent-chip-text)]"
                  : "border-card-border bg-surface text-muted hover:text-foreground",
              )}
            >
              {playlist.emoji} {playlist.name}
            </motion.button>
          ))}
        </div>
      )}

      {viewFilter !== "playlist" && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryChip
            label="All Categories"
            emoji="🌈"
            active={activeCategory === "All"}
            onClick={() => setActiveCategory("All")}
          />
          {CATEGORIES.filter((c) => c !== "Custom").map((category) => (
            <CategoryChip
              key={category}
              label={category}
              emoji={CATEGORY_EMOJI[category as SoundCategory]}
              active={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-[var(--accent-chip-border)] bg-[var(--accent-chip)] text-[var(--accent-chip-text)]"
          : "border-card-border bg-surface text-muted hover:border-card-border hover:text-foreground",
      )}
    >
      {emoji} {label}
    </motion.button>
  );
}
