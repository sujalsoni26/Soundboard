"use client";

import { useSoundboard } from "@/hooks/use-soundboard";
import { SoundCard } from "./SoundCard";

export function TrendingSection() {
  const { trendingSounds, viewFilter, playCounts } = useSoundboard();

  if (viewFilter !== "all") return null;

  const top = trendingSounds.filter((s) => (playCounts[s.id] ?? 0) > 0).slice(0, 4);
  if (top.length === 0) return null;

  return (
    <section aria-label="Trending sounds" className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">🔥</span>
        <h2 className="text-lg font-semibold text-foreground">Trending</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {top.map((sound, index) => (
          <SoundCard key={sound.id} sound={sound} index={index} />
        ))}
      </div>
    </section>
  );
}
