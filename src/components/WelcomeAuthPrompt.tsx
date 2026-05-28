"use client";

import { useState } from "react";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";
import { Modal } from "@/components/Modals";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";

export function WelcomeAuthPrompt() {
  const { user, loading, configured } = useAuth();
  const [guestSkipped, setGuestSkipped] = useLocalStorage(STORAGE_KEYS.authGuestSkipped, false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>("signin");
  const [authSession, setAuthSession] = useState(0);

  if (!configured || user) return null;

  const showWelcome = !loading && !guestSkipped && !authOpen;

  const openAuth = (mode: AuthModalMode) => {
    setAuthMode(mode);
    setAuthSession((n) => n + 1);
    setAuthOpen(true);
  };

  const continueAsGuest = () => {
    setGuestSkipped(true);
  };

  return (
    <>
      <Modal open={showWelcome} onClose={continueAsGuest} title="Welcome to Meme Soundboard">
        <p className="mb-4 text-sm text-muted">
          Sign in to sync your favorites and playlists across devices, or continue as a guest —
          everything works locally on this device.
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => openAuth("signin")}
            className="min-h-11 w-full touch-manipulation rounded-xl bg-violet-500 py-2.5 text-sm font-medium text-white active:opacity-90"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="min-h-11 w-full touch-manipulation rounded-xl border border-card-border bg-surface py-2.5 text-sm font-medium text-foreground active:bg-surface-hover"
          >
            Create account
          </button>
          <button
            type="button"
            onClick={continueAsGuest}
            className="min-h-11 w-full touch-manipulation rounded-xl py-2.5 text-sm text-muted active:text-foreground"
          >
            Continue as guest
          </button>
        </div>
      </Modal>

      <AuthModal
        key={authSession}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onSuccess={() => setGuestSkipped(false)}
      />
    </>
  );
}
