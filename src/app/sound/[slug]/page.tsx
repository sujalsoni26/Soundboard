"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { SoundCard } from "@/components/SoundCard";
import { useSoundboard } from "@/hooks/use-soundboard";
import { cn } from "@/utils/cn";

export default function SoundPage() {
  const params = useParams<{ slug: string }>();
  const { getSoundBySlug, toggleSound, playSound, isSoundPlaying, settings, sounds } =
    useSoundboard();
  const sound = getSoundBySlug(params.slug);
  const isPlaying = sound ? isSoundPlaying(sound.id) : false;

  useEffect(() => {
    if (sound && settings.autoplayOnShare) {
      const timer = setTimeout(() => playSound(sound), 300);
      return () => clearTimeout(timer);
    }
  }, [sound, settings.autoplayOnShare, playSound]);

  if (!sound) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 text-6xl">🤷</span>
        <h1 className="text-2xl font-bold text-foreground">Sound not found</h1>
        <p className="mt-2 text-muted">This meme might have gone offline.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-2.5 text-sm font-medium text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to soundboard
        </Link>
      </div>
    );
  }

  const related = sounds.filter((s) => s.category === sound.category && s.id !== sound.id).slice(0, 4);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to soundboard
      </Link>

      <div className="mb-8 text-center">
        <span className="text-6xl">{sound.emoji}</span>
        <h1 className="mt-4 text-3xl font-bold text-foreground">{sound.title}</h1>
        <p className="mt-2 text-muted">{sound.category}</p>
        <button
          type="button"
          onClick={() => toggleSound(sound)}
          className={cn(
            "mt-6 rounded-2xl px-8 py-3 text-lg font-semibold text-white shadow-lg",
            isPlaying
              ? "bg-red-500/90 shadow-red-500/25 hover:bg-red-500"
              : "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-500/25",
          )}
        >
          {isPlaying ? "■ Stop Sound" : "▶ Play Sound"}
        </button>
      </div>

      <div className="mx-auto max-w-sm">
        <SoundCard sound={sound} />
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            More from {sound.category}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {related.map((s, i) => (
              <SoundCard key={s.id} sound={s} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
