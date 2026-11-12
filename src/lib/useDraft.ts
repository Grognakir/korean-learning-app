"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readWithLegacy, scopedKey } from "./legacyStorage";
import { useStorageUserId } from "./StorageUser";

const memory = new Map<string, string>();
const failed = new Set<string>();
const EVENT = "learning-draft";
const OWNER_KEY = "drafts:legacy-owner";

function read(key: string, legacyKey: string, userId: string | undefined) {
  if (failed.has(key)) return memory.get(key) ?? "";
  try {
    return readWithLegacy(key, legacyKey, OWNER_KEY, userId) ?? "";
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

// Ключ получает префикс аккаунта здесь, в единственном месте: вызывающие
// передают «чистый» ключ, поэтому двойного префикса не бывает. Черновики,
// записанные до разделения по аккаунтам, достаются первому вошедшему.
export function useDraft(baseKey: string) {
  const userId = useStorageUserId();
  const key = scopedKey(baseKey, userId);
  const value = useSyncExternalStore(subscribe, () => read(key, baseKey, userId), () => "");
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
