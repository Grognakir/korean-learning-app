"use client";

import { createContext, useContext, type ReactNode } from "react";
import { scopedKey } from "./legacyStorage";

const StorageUser = createContext<string | undefined>(undefined);

export function StorageUserProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  return <StorageUser.Provider value={userId}>{children}</StorageUser.Provider>;
}

export function useStorageUserId() {
  return useContext(StorageUser);
}

export function useUserStorageKey(base: string) {
  return scopedKey(base, useContext(StorageUser));
}

export function useTrainerStorageKey(trainer: string) {
  return useUserStorageKey(trainer);
}
