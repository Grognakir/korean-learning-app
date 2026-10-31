"use client";

import { useCallback, useSyncExternalStore } from "react";

const memory = new Map<string, string>();
const failed = new Set<string>();
const EVENT = "learning-draft";

function read(key: string | undefined) {
  if (!key) return "";
  if (failed.has(key)) return memory.get(key) ?? "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return memory.get(key) ?? "";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useDraft(key: string) {
  const value = useSyncExternalStore(subscribe, () => read(key), () => "");
  const update = useCallback((next: string) => {
    memory.set(key, next);
    try {
      window.localStorage.setItem(key, next);
      failed.delete(key);
    } catch { failed.add(key); }
    window.dispatchEvent(new Event(EVENT));
  }, [key]);
  return [value, update] as const;
}
