"use client";

import { createContext, useContext, type ReactNode } from "react";

const StorageUser = createContext<string | undefined>(undefined);

export function StorageUserProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  return <StorageUser.Provider value={userId}>{children}</StorageUser.Provider>;
}

export function useTrainerStorageKey(trainer: string) {
  const userId = useContext(StorageUser);
  return userId ? `user:${userId}:${trainer}` : trainer;
}
