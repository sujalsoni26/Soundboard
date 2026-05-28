"use client";

import { Loader2, LogOut, Shield, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/utils/cn";

export function AuthButton({ compact = false }: { compact?: boolean }) {
  const { user, profile, loading, configured, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);

  if (!configured) return null;

  if (loading) {
    return (
      <span
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-card-border bg-surface px-2.5 text-muted lg:h-9"
        aria-label="Loading account"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    );
  }

  if (user) {
    const label = profile?.email?.split("@")[0] ?? "Account";
    return (
      <div className="flex shrink-0 items-center gap-1">
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Admin panel"
            title="Admin panel"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 active:bg-amber-500/20 dark:text-amber-300 lg:h-9 lg:w-9 lg:hover:bg-amber-500/20"
          >
            <Shield className="h-4 w-4" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          aria-label={`Sign out (${profile?.email ?? label})`}
          title={`Sign out · ${profile?.email ?? label}`}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 font-medium text-rose-700 active:bg-rose-500/20 dark:text-rose-300 lg:hover:bg-rose-500/20",
            compact ? "h-10 px-2.5 sm:px-3 lg:h-9" : "h-10 px-3 text-xs lg:h-9",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span className={cn("truncate text-xs", compact && "hidden sm:inline max-w-[4.5rem]")}>
            {compact ? "Sign out" : label}
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setModalSession((n) => n + 1);
          setOpen(true);
        }}
        aria-label="Sign in to your account"
        title="Sign in to sync favorites & uploads"
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500 font-medium text-white shadow-sm shadow-violet-500/25 active:bg-violet-600 lg:hover:bg-violet-400",
          compact ? "h-10 px-2.5 sm:px-3 lg:h-9" : "h-10 px-3.5 text-xs lg:h-9",
        )}
      >
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
        <span className={cn("text-xs", compact && "hidden sm:inline")}>Sign in</span>
      </button>

      <AuthModal key={modalSession} open={open} onClose={() => setOpen(false)} initialMode="signin" />
    </>
  );
}
