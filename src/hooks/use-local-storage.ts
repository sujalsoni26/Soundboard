"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getItem, setItem } from "@/utils/storage";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function useLocalStorage<T>(key: string, fallback: T) {
  const fallbackSnapshot = useMemo(() => JSON.stringify(fallback), [fallback]);

  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(getItem<T>(key, fallback)),
    () => fallbackSnapshot,
  );

  const value = useMemo(() => JSON.parse(snapshot) as T, [snapshot]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = getItem<T>(key, fallback);
      const updated =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      setItem(key, updated);
      emitChange();
    },
    [key, fallback],
  );

  return [value, setValue] as const;
}

export function useLocalStorageSet(key: string) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(getItem<string[]>(key, [])),
    () => "[]",
  );

  const value = useMemo(() => new Set(JSON.parse(snapshot) as string[]), [snapshot]);

  const setValue = useCallback(
    (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      const current = new Set(getItem<string[]>(key, []));
      const next = typeof updater === "function" ? updater(current) : updater;
      setItem(key, Array.from(next));
      emitChange();
    },
    [key],
  );

  return [value, setValue] as const;
}
