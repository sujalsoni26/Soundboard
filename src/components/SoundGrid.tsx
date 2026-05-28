"use client";

import { useSoundboard } from "@/hooks/use-soundboard";
import { SoundCard } from "./SoundCard";

export function SoundGrid() {
  const { filteredSounds, viewFilter, activePlaylistId, playlists } = useSoundboard();

  if (filteredSounds.length === 0) {
    const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
    const isEmptyPlaylist = viewFilter === "playlist" && activePlaylist;

    const isEmptyHidden = viewFilter === "hidden";

    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-card-border bg-card px-6 py-16 text-center">
        <span className="mb-3 text-5xl">{isEmptyPlaylist ? activePlaylist.emoji : isEmptyHidden ? "👁️‍🗨️" : "🔇"}</span>
        <h3 className="text-lg font-semibold text-foreground">
          {isEmptyPlaylist
            ? `${activePlaylist!.name} is empty`
            : isEmptyHidden
              ? "No hidden sounds"
              : "No sounds found"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          {isEmptyPlaylist
            ? "Tap the pencil icon on any sound to add it to this playlist."
            : isEmptyHidden
              ? "Use the pencil icon on a sound and choose Hide to remove it from your board."
              : "Try a different search, category, or upload your own meme sounds."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 [&>*]:h-full [&>*]:min-w-0"
      role="list"
      aria-label={`${filteredSounds.length} sounds`}
    >
      {filteredSounds.map((sound, index) => (
        <SoundCard key={sound.id} sound={sound} index={index} />
      ))}
    </div>
  );
}
