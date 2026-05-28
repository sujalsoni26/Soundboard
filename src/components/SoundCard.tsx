"use client";

import { motion } from "framer-motion";
import { Heart, Pencil, Share2, Square, Volume2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EditSoundModal } from "@/components/SoundManageModals";
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
  const [editOpen, setEditOpen] = useState(false);
  const isPlaying = isSoundPlaying(sound.id);
  const isFavorite = favorites.has(sound.id);

  const handleShare = () => shareSoundBySettings(sound);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.02, 0.3) }}
        className={cn(
          "group relative flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-card-border bg-card p-2.5 sm:p-4",
          "transition-colors active:bg-surface-hover sm:hover:border-violet-400/30 sm:hover:bg-surface-hover",
          isPlaying && "border-violet-400/50 shadow-lg shadow-violet-500/20",
        )}
      >
        <button
          type="button"
          onClick={() => toggleSound(sound)}
          aria-label={isPlaying ? `Stop ${sound.title}` : `Play ${sound.title}`}
          aria-pressed={isPlaying}
          className="flex min-h-0 min-w-0 flex-1 flex-col items-start overflow-hidden text-left"
        >
          <motion.span
            animate={isPlaying ? { scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className="mb-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden text-2xl sm:mb-2 sm:h-10 sm:w-10 sm:text-3xl"
          >
            {sound.emoji}
          </motion.span>
          <h3 className="line-clamp-2 w-full min-w-0 overflow-hidden text-sm leading-snug font-semibold break-words text-foreground [overflow-wrap:anywhere] sm:text-base">
            {sound.title}
          </h3>
          <p className="mt-0.5 w-full min-w-0 truncate text-[11px] text-muted sm:mt-1 sm:text-xs">
            {sound.category}
            {sound.pendingApproval && (
              <span className="ml-1 text-amber-600 dark:text-amber-300">· Pending review</span>
            )}
          </p>
          {(playCounts[sound.id] ?? 0) > 0 && (
            <p className="mt-1 w-full min-w-0 truncate text-[11px] text-muted sm:text-xs">
              ▶ {formatPlayCount(playCounts[sound.id] ?? 0)} plays
            </p>
          )}
        </button>

        <div className="mt-2 w-full min-w-0 shrink-0 sm:mt-3">
          <div className="grid w-full min-w-0 grid-cols-4 gap-0.5 sm:gap-1">
            <IconButton label="Edit sound name & playlists" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </IconButton>
            <IconButton
              label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={() => toggleFavorite(sound.id)}
              active={isFavorite}
            >
              <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isFavorite && "fill-pink-400 text-pink-400")} />
            </IconButton>
            <IconButton label="Share sound" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </IconButton>
            <Link
              href={`/sound/${sound.slug}`}
              aria-label={`Open ${sound.title} page`}
              className="inline-flex aspect-square w-full min-h-[44px] min-w-0 max-w-full touch-manipulation items-center justify-center rounded-lg bg-surface text-muted active:bg-surface-hover active:text-foreground sm:min-h-0 sm:rounded-xl"
            >
              <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {isPlaying && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSound(sound)}
              className="mt-1.5 flex w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-red-500/15 px-2 py-2 text-xs font-medium text-red-600 active:bg-red-500/25 dark:text-red-300 sm:mt-2 sm:py-1.5 sm:hover:bg-red-500/25"
              aria-label={`Stop ${sound.title}`}
            >
              <Square className="h-3 w-3 shrink-0 fill-current" />
              <span className="truncate">Stop</span>
            </motion.button>
          )}
        </div>
      </motion.article>

      <EditSoundModal sound={sound} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
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
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex aspect-square w-full min-h-[44px] min-w-0 max-w-full touch-manipulation items-center justify-center rounded-lg bg-surface text-muted active:bg-surface-hover active:text-foreground sm:min-h-0 sm:rounded-xl",
        "sm:hover:bg-surface-hover sm:hover:text-foreground",
        active && "bg-pink-500/15 text-pink-500 dark:text-pink-300",
      )}
    >
      {children}
    </motion.button>
  );
}
