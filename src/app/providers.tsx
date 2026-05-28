"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { SoundboardProvider } from "@/hooks/use-soundboard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SoundboardProvider>{children}</SoundboardProvider>
    </AuthProvider>
  );
}
