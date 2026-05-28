"use client";

import { Search, X } from "lucide-react";
import { useSoundboard } from "@/hooks/use-soundboard";
import { cn } from "@/utils/cn";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useSoundboard();

  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search memes, tags, categories..."
        aria-label="Search sounds"
        className={cn(
          "h-12 w-full rounded-2xl border border-card-border bg-input pr-12 pl-12",
          "text-base text-foreground placeholder:text-muted",
          "focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 focus:outline-none",
        )}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
