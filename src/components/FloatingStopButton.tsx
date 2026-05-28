"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Square } from "lucide-react";
import { useSoundboard } from "@/hooks/use-soundboard";
import { cn, vibrate } from "@/utils/cn";

interface FloatingStopButtonProps {
  /** Hide while mobile drawer or other overlays are open */
  hidden?: boolean;
}

export function FloatingStopButton({ hidden = false }: FloatingStopButtonProps) {
  const { playingIds, stopAllSounds, settings } = useSoundboard();
  const isAnyPlaying = playingIds.size > 0;
  const show = isAnyPlaying && !hidden;

  const handleStop = () => {
    stopAllSounds();
    if (settings.vibrationEnabled) vibrate(10);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.88, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 16 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          onClick={handleStop}
          aria-label={`Stop all sounds (${playingIds.size} playing)`}
          className={cn(
            "fixed z-40 inline-flex min-h-12 min-w-12 touch-manipulation items-center justify-center gap-2 rounded-full",
            "border border-red-400/35 bg-red-500 px-4 text-sm font-semibold text-white",
            "shadow-lg shadow-red-500/35 select-none",
            "right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))]",
            "sm:right-[max(1rem,env(safe-area-inset-right))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:min-h-11 sm:px-5",
          )}
        >
          <Square className="h-4 w-4 shrink-0 fill-current" />
          <span>Stop All</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
