"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Language } from "@/features/dictionary/types";

const ActiveLanguageContext = createContext<Language>("ko");

export function ActiveLanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  return (
    <ActiveLanguageContext.Provider value={language}>
      {children}
    </ActiveLanguageContext.Provider>
  );
}

export function useActiveLanguage(): Language {
  return useContext(ActiveLanguageContext);
}
