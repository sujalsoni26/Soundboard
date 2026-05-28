"use client";

import { Search, X } from "lucide-react";
import { useSoundboard } from "@/hooks/use-soundboard";
import { cn } from "@/utils/cn";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const { searchQuery, setSearchQuery } = useSoundboard();

  return (
    <div className="relative w-full min-w-0">
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted",
          compact ? "left-3 h-4 w-4" : "left-4 h-5 w-5",
        )}
        aria-hidden
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={compact ? "Search sounds..." : "Search memes, tags, categories..."}
        aria-label="Search sounds"
        className={cn(
          "w-full rounded-xl border border-card-border bg-input text-foreground placeholder:text-muted",
          "focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 focus:outline-none",
          compact
            ? "h-10 pr-9 pl-9 text-base sm:text-sm"
            : "h-12 rounded-2xl pr-12 pl-12 text-base",
        )}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          aria-label="Clear search"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full text-muted active:bg-surface-hover active:text-foreground sm:hover:bg-surface-hover sm:hover:text-foreground",
            compact ? "right-2 inline-flex h-8 w-8 items-center justify-center" : "right-3 p-1.5",
          )}
        >
          <X className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      )}
    </div>
  );
}
