"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PagedEntry } from "@/features/dictionary/usePagedQuery";
import { createPageCache, type PageResult } from "./pageCache";
import type { PagedCache } from "./usePagedQuery";
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
  pageCache: ReturnType<typeof createPageCache>;
  requestCachedResults: (key: string, run: () => PromiseLike<PageResult>) => Promise<PageResult>;
};

const DictionaryCacheContext = createContext<DictionaryCacheValue | null>(null);


export function DictionaryCacheProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<FilterState>(DEFAULT_STATE);
  const [resultsGeneration, setResultsGeneration] = useState(0);
  const [pageCache] = useState(createPageCache);

  const setState = useCallback((patch: Partial<FilterState>) => {
    setStateRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  const getCachedResults = useCallback((key: string) => pageCache.get<Word>(key), [pageCache]);
  const setCachedResults = useCallback((key: string, entry: ResultsEntry) => pageCache.set(key, entry), [pageCache]);
  const clearResultsCache = useCallback(() => {
    pageCache.clear();
    setResultsGeneration((n) => n + 1);
  }, [pageCache]);

  return (
    <DictionaryCacheContext.Provider
      value={{
        state,
        setState,
        getCachedResults,
        setCachedResults,
        clearResultsCache,
        resultsGeneration,
        pageCache,
        requestCachedResults: pageCache.request,
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

export function useDictionaryPageCache<T>(): PagedCache<T> {
  const { pageCache, resultsGeneration } = useDictionaryCache();
  return useMemo(() => ({
    get: (key: string) => pageCache.get<T>(key),
    set: (key: string, entry: PagedEntry<T>) => pageCache.set(key, entry),
    request: pageCache.request,
    generation: resultsGeneration,
  }), [pageCache, resultsGeneration]);
}
