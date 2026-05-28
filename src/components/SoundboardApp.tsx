"use client";

import Image from "next/image";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ControlBar } from "@/components/ControlBar";
import { ErrorToast } from "@/components/ErrorToast";
import { HeaderActions } from "@/components/Modals";
import { SearchBar } from "@/components/SearchBar";
import { SoundGrid } from "@/components/SoundGrid";
import { TrendingSection } from "@/components/TrendingSection";
import { useKeyboardShortcuts, useSoundboard } from "@/hooks/use-soundboard";
import { SITE_LOGO } from "@/lib/constants";

export function SoundboardApp() {
  useKeyboardShortcuts();
  const { sounds } = useSoundboard();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-5 pb-24 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Image
              src={SITE_LOGO}
              alt="Meme Soundboard logo"
              width={52}
              height={52}
              priority
              className="size-[52px] shrink-0 rounded-2xl object-cover shadow-md shadow-violet-500/20"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-accent-text">Meme Soundboard</p>
              <h1 className="bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                Press. Laugh. Repeat.
              </h1>
              <p className="mt-1 text-sm text-muted">{sounds.length} sounds ready to go</p>
            </div>
          </div>
          <HeaderActions />
        </div>
        <SearchBar />
      </header>

      <div className="mb-5 space-y-4">
        <CategoryTabs />
        <ControlBar />
      </div>

      <TrendingSection />
      <SoundGrid />
      <ErrorToast />
    </div>
  );
}
