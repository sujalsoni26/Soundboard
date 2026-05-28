"use client";

import { AlertCircle, X } from "lucide-react";
import { useSoundboard } from "@/hooks/use-soundboard";
import { cn } from "@/utils/cn";

export function ErrorToast() {
  const { playbackError, clearPlaybackError, playingIds } = useSoundboard();
  if (!playbackError) return null;

  const fabOffset = playingIds.size > 0;

  return (
    <div
      role="alert"
      className={cn(
        "fixed z-[55] flex max-w-sm items-start gap-3 rounded-2xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-xl dark:bg-red-950/90 dark:text-red-100",
        "right-3 left-3 sm:left-auto sm:w-auto",
        fabOffset
          ? "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1">{playbackError}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={clearPlaybackError}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg active:bg-red-500/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
