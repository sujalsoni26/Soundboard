"use client";

import { useSoundboard } from "@/hooks/use-soundboard";
import { SoundCard } from "./SoundCard";

export function SoundGrid() {
  const { filteredSounds } = useSoundboard();

  if (filteredSounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-card-border bg-card px-6 py-16 text-center">
        <span className="mb-3 text-5xl">🔇</span>
        <h3 className="text-lg font-semibold text-foreground">No sounds found</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Try a different search, category, or upload your own meme sounds.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      role="list"
      aria-label={`${filteredSounds.length} sounds`}
    >
      {filteredSounds.map((sound, index) => (
        <SoundCard key={sound.id} sound={sound} index={index} />
      ))}
    </div>
  );
}
