"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useCallback, useState } from "react";
import { ActiveFilterBar } from "@/components/ActiveFilterBar";
import { ErrorToast } from "@/components/ErrorToast";
import { FloatingStopButton } from "@/components/FloatingStopButton";
import { useAppModals } from "@/components/Modals";
import { SearchBar } from "@/components/SearchBar";
import { Sidebar } from "@/components/Sidebar";
import { SoundGrid } from "@/components/SoundGrid";
import { TrendingSection } from "@/components/TrendingSection";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useKeyboardShortcuts, useSoundboard } from "@/hooks/use-soundboard";
import { STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/utils/cn";

export function SoundboardApp() {
  useKeyboardShortcuts();
  const { filteredSounds } = useSoundboard();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarVisible, setSidebarVisible] = useLocalStorage(STORAGE_KEYS.sidebarVisible, true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { modalHost, isModalOpen, openPlaylists, openUpload, openShortcuts, openSettings } = useAppModals();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const isSidebarOpen = isDesktop ? sidebarVisible : mobileOpen;

  const toggleSidebar = () => {
    if (isDesktop) setSidebarVisible((v) => !v);
    else setMobileOpen((o) => !o);
  };

  const openWithMobileClose = useCallback(
    (open: () => void) => {
      open();
      closeMobile();
    },
    [closeMobile],
  );

  return (
    <div className={cn("min-h-screen transition-[padding] duration-300", sidebarVisible && "lg:pl-56")}>
      <Sidebar
        visible={sidebarVisible}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
        onHide={() => setSidebarVisible(false)}
        onOpenPlaylists={() => openWithMobileClose(openPlaylists)}
        onOpenUpload={() => openWithMobileClose(openUpload)}
        onOpenShortcuts={() => openWithMobileClose(openShortcuts)}
        onOpenSettings={() => openWithMobileClose(openSettings)}
      />

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 pb-[max(6.5rem,env(safe-area-inset-bottom))] sm:px-4 lg:px-6 lg:pb-20">
        <header className="sticky top-0 z-20 -mx-3 mb-3 flex items-center gap-2 border-b border-card-border bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md sm:-mx-4 sm:px-4 lg:static lg:mx-0 lg:mb-4 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-4 lg:backdrop-blur-none">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-sidebar"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-foreground active:bg-surface-hover lg:h-9 lg:w-9"
          >
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <SearchBar compact />
          </div>
        </header>

        <main className="flex-1">
          <ActiveFilterBar />
          <TrendingSection />
          <p className="mb-2 text-xs text-muted">{filteredSounds.length} sounds</p>
          <SoundGrid />
        </main>

        <ErrorToast />
      </div>

      <FloatingStopButton hidden={mobileOpen || isModalOpen} />
      {modalHost}
    </div>
  );
}
