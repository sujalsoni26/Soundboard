"use client";

import { motion } from "framer-motion";
import { Heart, Share2, Square, Volume2 } from "lucide-react";
import Link from "next/link";
import { useSoundboard } from "@/hooks/use-soundboard";
import type { Sound } from "@/types/sound";
import { cn, formatPlayCount } from "@/utils/cn";

interface SoundCardProps {
  sound: Sound;
  index?: number;
}

export function SoundCard({ sound, index = 0 }: SoundCardProps) {
  const { toggleSound, toggleFavorite, favorites, isSoundPlaying, playCounts, shareSoundBySettings } =
    useSoundboard();
  const isPlaying = isSoundPlaying(sound.id);
  const isFavorite = favorites.has(sound.id);

  const handleShare = () => shareSoundBySettings(sound);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-card-border bg-card p-4",
        "transition-colors hover:border-violet-400/30 hover:bg-surface-hover",
        isPlaying && "border-violet-400/50 shadow-lg shadow-violet-500/20",
      )}
    >
      <button
        type="button"
        onClick={() => toggleSound(sound)}
        aria-label={isPlaying ? `Stop ${sound.title}` : `Play ${sound.title}`}
        aria-pressed={isPlaying}
        className="flex flex-1 flex-col items-start text-left"
      >
        <motion.span
          animate={isPlaying ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
          className="mb-3 text-4xl"
        >
          {sound.emoji}
        </motion.span>
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">{sound.title}</h3>
        <p className="mt-1 text-xs text-muted">{sound.category}</p>
        {(playCounts[sound.id] ?? 0) > 0 && (
          <p className="mt-2 text-xs text-muted">
            ▶ {formatPlayCount(playCounts[sound.id] ?? 0)} plays
          </p>
        )}
      </button>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <IconButton
            label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => toggleFavorite(sound.id)}
            active={isFavorite}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-pink-400 text-pink-400")} />
          </IconButton>
          <IconButton label="Share sound" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </IconButton>
          <Link
            href={`/sound/${sound.slug}`}
            aria-label={`Open ${sound.title} page`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <Volume2 className="h-4 w-4" />
          </Link>
        </div>
        {isPlaying ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleSound(sound)}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-500/25"
            aria-label={`Stop ${sound.title}`}
          >
            <Square className="h-3 w-3 fill-current" />
            Stop
          </motion.button>
        ) : (
          <span className="text-xs text-muted">Tap to play</span>
        )}
      </div>
    </motion.article>
  );
}

function IconButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-muted",
        "hover:bg-surface-hover hover:text-foreground",
        active && "bg-pink-500/15 text-pink-500 dark:text-pink-300",
      )}
    >
      {children}
    </motion.button>
  );
}
