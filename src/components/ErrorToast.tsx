"use client";

import { AlertCircle, X } from "lucide-react";
import { useSoundboard } from "@/hooks/use-soundboard";

export function ErrorToast() {
  const { playbackError, clearPlaybackError } = useSoundboard();
  if (!playbackError) return null;

  return (
    <div
      role="alert"
      className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-xl dark:bg-red-950/90 dark:text-red-100"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1">{playbackError}</p>
      <button type="button" aria-label="Dismiss" onClick={clearPlaybackError}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
