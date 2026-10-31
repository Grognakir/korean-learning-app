"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createOsStore } from "./store";

const OsStorage = createContext(createOsStore());

export function OsStorageProvider({ userId, children, migrateLegacy = true }: { userId?: string; children: ReactNode; migrateLegacy?: boolean }) {
  const store = useMemo(() => createOsStore(userId, migrateLegacy), [userId, migrateLegacy]);
  return <OsStorage.Provider value={store}>{children}</OsStorage.Provider>;
}

export const useOsStore = () => useContext(OsStorage);
