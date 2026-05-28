"use client";

import { useSyncExternalStore } from "react";

function subscribeMedia(query: string, callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribeMedia(query, callback),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useDebouncedValue<T>(value: T): T {
  return value;
}
