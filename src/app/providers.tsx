"use client";

import { SoundboardProvider } from "@/hooks/use-soundboard";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SoundboardProvider>{children}</SoundboardProvider>;
}
