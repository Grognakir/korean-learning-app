"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PagedEntry } from "@/features/dictionary/usePagedQuery";
import type { Word } from "@/features/dictionary/types";

type FilterState = {
  query: string;
  sortDir: "asc" | "desc";
  pageSize: number;
  page: number;
  partOfSpeech: string;
  categoryId: string;
  ownership: "all" | "global" | "mine";
  openPanel: "filters" | "view" | null;
  expandedId: string | null;
};

export const DEFAULT_STATE: FilterState = {
  query: "",
  sortDir: "asc",
  pageSize: 10,
  page: 1,
  partOfSpeech: "",
  categoryId: "",
  ownership: "all",
  openPanel: null,
  expandedId: null,
};

type ResultsEntry = PagedEntry<Word>;

type DictionaryCacheValue = {
  state: FilterState;
  setState: (patch: Partial<FilterState>) => void;
  getCachedResults: (key: string) => ResultsEntry | undefined;
  setCachedResults: (key: string, entry: ResultsEntry) => void;
  clearResultsCache: () => void;
  resultsGeneration: number;
};

const DictionaryCacheContext = createContext<DictionaryCacheValue | null>(null);

const MAX_CACHE_ENTRIES = 8;

export function DictionaryCacheProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<FilterState>(DEFAULT_STATE);
  const [resultsGeneration, setResultsGeneration] = useState(0);
  const cacheRef = useRef(new Map<string, ResultsEntry>());

  const setState = useCallback((patch: Partial<FilterState>) => {
    setStateRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  const getCachedResults = useCallback(
    (key: string) => cacheRef.current.get(key),
    [],
  );

  const setCachedResults = useCallback((key: string, entry: ResultsEntry) => {
    const cache = cacheRef.current;
    cache.delete(key);
    cache.set(key, entry);
    if (cache.size > MAX_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
  }, []);

  const clearResultsCache = useCallback(() => {
    cacheRef.current.clear();
    setResultsGeneration((n) => n + 1);
  }, []);

  return (
    <DictionaryCacheContext.Provider
      value={{
        state,
        setState,
        getCachedResults,
        setCachedResults,
        clearResultsCache,
        resultsGeneration,
      }}
    >
      {children}
    </DictionaryCacheContext.Provider>
  );
}

export function useDictionaryCache() {
  const ctx = useContext(DictionaryCacheContext);
  if (!ctx) {
    throw new Error(
      "useDictionaryCache must be used within DictionaryCacheProvider",
    );
  }
  return ctx;
}
