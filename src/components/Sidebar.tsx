"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Dice5,
  Keyboard,
  ListMusic,
  LogOut,
  PanelLeftClose,
  Settings,
  Shield,
  Shuffle,
  Square,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { CATEGORY_EMOJI, CATEGORIES, SITE_LOGO } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSoundboard, type ViewFilter } from "@/hooks/use-soundboard";
import type { SoundCategory } from "@/types/sound";
import { cn } from "@/utils/cn";

const FILTERS: { id: ViewFilter; label: string; emoji: string }[] = [
  { id: "all", label: "All Sounds", emoji: "🎵" },
  { id: "favorites", label: "Favorites", emoji: "⭐" },
  { id: "recent", label: "Recent", emoji: "🕐" },
  { id: "trending", label: "Trending", emoji: "🔥" },
  { id: "hidden", label: "Hidden", emoji: "👁️‍🗨️" },
];

interface SidebarProps {
  visible: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onHide: () => void;
  onOpenPlaylists: () => void;
  onOpenUpload: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  visible,
  mobileOpen,
  onClose,
  onHide,
  onOpenPlaylists,
  onOpenUpload,
  onOpenShortcuts,
  onOpenSettings,
}: SidebarProps) {
  const {
    visibleSoundCount,
    hiddenSounds,
    activeCategory,
    setActiveCategory,
    viewFilter,
    setViewFilter,
    playlists,
    activePlaylistId,
    selectPlaylist,
    stopAllSounds,
    playRandom,
    settings,
    updateSettings,
    playingIds,
  } = useSoundboard();

  const { user, profile, signOut, isAdmin, configured } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onClose]);

  const isAnyPlaying = playingIds.size > 0;

  const handleFilter = (filter: ViewFilter) => {
    setViewFilter(filter);
    onClose();
  };

  const handleCategory = (category: SoundCategory | "All") => {
    setActiveCategory(category);
    if (viewFilter === "playlist" || viewFilter === "hidden") setViewFilter("all");
    onClose();
  };

  const handlePlaylist = (playlistId: string) => {
    if (activePlaylistId === playlistId && viewFilter === "playlist") selectPlaylist(null);
    else selectPlaylist(playlistId);
    onClose();
  };

  const handleQuickAction = (action: () => void) => {
    action();
    onClose();
  };

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-card-border px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:pt-3">
        <Image
          src={SITE_LOGO}
          alt="Meme Soundboard"
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">Meme Soundboard</p>
          <p className="text-[11px] text-muted">{visibleSoundCount} sounds</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted active:bg-surface-hover active:text-foreground lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onHide}
          aria-label="Hide sidebar"
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-hover hover:text-foreground lg:inline-flex"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-2 py-3 [-webkit-overflow-scrolling:touch]">
        <SidebarSection title="Browse">
          {FILTERS.map((filter) => (
            <SidebarItem
              key={filter.id}
              emoji={filter.emoji}
              label={
                filter.id === "hidden" && hiddenSounds.size > 0
                  ? `${filter.label} (${hiddenSounds.size})`
                  : filter.label
              }
              active={viewFilter === filter.id}
              onClick={() => handleFilter(filter.id)}
            />
          ))}
        </SidebarSection>

        {playlists.length > 0 && viewFilter !== "hidden" && (
          <SidebarSection title="Playlists">
            {playlists.map((playlist) => (
              <SidebarItem
                key={playlist.id}
                emoji={playlist.emoji}
                label={playlist.name}
                active={viewFilter === "playlist" && activePlaylistId === playlist.id}
                onClick={() => handlePlaylist(playlist.id)}
              />
            ))}
          </SidebarSection>
        )}

        {viewFilter !== "playlist" && viewFilter !== "hidden" && (
          <SidebarSection title="Categories" collapsible defaultOpen={isDesktop}>
            <SidebarItem
              emoji="🌈"
              label="All Categories"
              active={activeCategory === "All"}
              onClick={() => handleCategory("All")}
            />
            {CATEGORIES.filter((c) => c !== "Custom").map((category) => (
              <SidebarItem
                key={category}
                emoji={CATEGORY_EMOJI[category]}
                label={category}
                active={activeCategory === category}
                onClick={() => handleCategory(category)}
              />
            ))}
          </SidebarSection>
        )}

        <SidebarSection title="Quick Actions">
          <SidebarAction
            icon={<Dice5 className="h-4 w-4" />}
            label="Random"
            onClick={() => handleQuickAction(() => playRandom(false))}
          />
          <SidebarAction
            icon={<Shuffle className="h-4 w-4" />}
            label="Random in Category"
            onClick={() => handleQuickAction(() => playRandom(true))}
          />
          {isAnyPlaying && (
            <SidebarAction
              icon={<Square className="h-4 w-4" />}
              label="Stop All"
              onClick={() => handleQuickAction(stopAllSounds)}
              variant="danger"
            />
          )}
        </SidebarSection>

        {configured && user && (
          <SidebarSection title="Account">
            <p className="truncate px-2 pb-1 text-xs text-muted" title={profile?.email ?? undefined}>
              {profile?.email ?? "Signed in"}
            </p>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-foreground/85 active:bg-surface-hover lg:min-h-0 lg:rounded-lg lg:px-2 lg:py-1.5 lg:hover:bg-surface-hover"
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span className="truncate">Admin</span>
              </Link>
            )}
            <SidebarAction
              icon={<LogOut className="h-4 w-4" />}
              label="Sign out"
              onClick={() => {
                void signOut();
                onClose();
              }}
              variant="danger"
            />
          </SidebarSection>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-card-border px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 py-1">
          <span className="w-6 text-[10px] text-muted">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.volume}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            aria-label="Volume"
            className="h-3 flex-1 cursor-pointer accent-violet-500 lg:h-2"
          />
          <span className="w-7 text-right text-[10px] text-muted">{Math.round(settings.volume * 100)}</span>
        </div>

        <div
          className={cn(
            "grid gap-1.5",
            user ? (isDesktop ? "grid-cols-4" : "grid-cols-3") : isDesktop ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          <SidebarIconButton label="Playlists" onClick={onOpenPlaylists}>
            <ListMusic className="h-4 w-4" />
          </SidebarIconButton>
          {user && (
            <SidebarIconButton label="Upload" onClick={onOpenUpload}>
              <Upload className="h-4 w-4" />
            </SidebarIconButton>
          )}
          {isDesktop && (
            <SidebarIconButton label="Shortcuts" onClick={onOpenShortcuts}>
              <Keyboard className="h-4 w-4" />
            </SidebarIconButton>
          )}
          <SidebarIconButton label="Settings" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </SidebarIconButton>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ x: visible ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        className="fixed inset-y-0 left-0 z-30 hidden h-[100dvh] w-56 flex-col border-r border-card-border bg-card/95 backdrop-blur-md lg:flex"
      >
        {content}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close menu"
              className="fixed inset-0 z-40 touch-none bg-black/55 backdrop-blur-[2px] lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              id="mobile-sidebar"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(16.5rem,82vw)] max-w-[280px] flex-col border-r border-card-border bg-modal shadow-2xl lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  if (!collapsible) {
    return (
      <section>
        <p className="mb-1 px-2 text-[10px] font-semibold tracking-wide text-muted uppercase">{title}</p>
        <div className="space-y-0.5">{children}</div>
      </section>
    );
  }

  return (
    <details open={defaultOpen} className="group">
      <summary className="mb-1 cursor-pointer list-none px-2 text-[10px] font-semibold tracking-wide text-muted uppercase select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1">
          {title}
          <span className="text-[9px] opacity-60 transition-transform group-open:rotate-180">▼</span>
        </span>
      </summary>
      <div className="space-y-0.5 pb-1">{children}</div>
    </details>
  );
}

function SidebarItem({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] w-full min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors active:scale-[0.98] lg:min-h-0 lg:rounded-lg lg:px-2 lg:py-1.5",
        active
          ? "bg-[var(--accent-chip)] font-medium text-[var(--accent-chip-text)]"
          : "text-foreground/85 active:bg-surface-hover lg:hover:bg-surface-hover",
      )}
    >
      <span className="shrink-0 text-base leading-none">{emoji}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarAction({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors active:scale-[0.98] lg:min-h-0 lg:rounded-lg lg:px-2 lg:py-1.5",
        variant === "danger"
          ? "text-red-600 active:bg-red-500/10 dark:text-red-300"
          : "text-foreground/85 active:bg-surface-hover lg:hover:bg-surface-hover",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex aspect-square min-h-[44px] w-full items-center justify-center rounded-xl bg-surface text-muted active:bg-surface-hover active:text-foreground lg:min-h-0 lg:rounded-lg lg:hover:bg-surface-hover lg:hover:text-foreground"
    >
      {children}
    </button>
  );
}
