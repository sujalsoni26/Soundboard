"use client";

import { motion } from "framer-motion";
import { useSoundboard } from "@/hooks/use-soundboard";
import type { Sound } from "@/types/sound";
import { cn } from "@/utils/cn";

export function TrendingSection() {
  const { trendingSounds, viewFilter, playCounts, toggleSound, isSoundPlaying } = useSoundboard();

  if (viewFilter !== "all") return null;

  const top = trendingSounds.filter((s) => (playCounts[s.id] ?? 0) > 0).slice(0, 4);
  if (top.length === 0) return null;

  return (
    <section aria-label="Trending sounds" className="mb-3">
      <div className="mb-1.5 flex items-center gap-1">
        <span className="text-sm">🔥</span>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">Trending</h2>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:gap-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {top.map((sound, index) => (
          <TrendingChip
            key={sound.id}
            sound={sound}
            index={index}
            isPlaying={isSoundPlaying(sound.id)}
            onToggle={() => toggleSound(sound)}
          />
        ))}
      </div>
    </section>
  );
}

function TrendingChip({
  sound,
  index,
  isPlaying,
  onToggle,
}: {
  sound: Sound;
  index: number;
  isPlaying: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.15) }}
      onClick={onToggle}
      aria-label={isPlaying ? `Stop ${sound.title}` : `Play ${sound.title}`}
      aria-pressed={isPlaying}
      className={cn(
        "flex w-[7.25rem] shrink-0 touch-manipulation items-center gap-2 rounded-xl border border-card-border bg-card px-2 py-1.5 text-left sm:w-auto",
        "transition-colors active:bg-surface-hover",
        isPlaying && "border-violet-400/50 bg-violet-500/10 shadow-sm shadow-violet-500/15",
      )}
    >
      <span className="shrink-0 text-lg leading-none">{sound.emoji}</span>
      <span className="line-clamp-2 min-w-0 text-[11px] leading-tight font-medium text-foreground sm:text-xs">
        {sound.title}
      </span>
    </motion.button>
  );
}
