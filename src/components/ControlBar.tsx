"use client";

import { motion } from "framer-motion";
import { Dice5, Shuffle, Square } from "lucide-react";
import { useSoundboard } from "@/hooks/use-soundboard";
import { cn } from "@/utils/cn";

export function ControlBar() {
  const { stopAllSounds, playRandom, settings, updateSettings, playingIds } = useSoundboard();
  const isAnyPlaying = playingIds.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionButton
        icon={<Dice5 className="h-5 w-5" />}
        label="Random Meme"
        onClick={() => playRandom(false)}
        variant="primary"
      />
      <ActionButton
        icon={<Shuffle className="h-5 w-5" />}
        label="Random in Category"
        onClick={() => playRandom(true)}
      />
      {isAnyPlaying && (
        <ActionButton
          icon={<Square className="h-5 w-5" />}
          label="Stop All"
          onClick={stopAllSounds}
          variant="danger"
        />
      )}

      <div className="ml-auto flex min-w-[180px] flex-1 items-center gap-3 sm:max-w-xs">
        <span className="text-xs text-muted">Vol</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.volume}
          onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
          aria-label="Volume"
          className="h-2 flex-1 cursor-pointer accent-violet-500"
        />
        <span className="w-8 text-right text-xs text-muted">
          {Math.round(settings.volume * 100)}
        </span>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium",
        variant === "primary" &&
          "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20",
        variant === "danger" &&
          "bg-red-500/15 text-red-600 dark:text-red-300 hover:bg-red-500/25",
        variant === "default" && "bg-surface text-foreground hover:bg-surface-hover",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
