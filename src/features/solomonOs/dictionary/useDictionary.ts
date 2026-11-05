"use client";

import { useEffect, useState } from "react";
import { useOsStore } from "../OsStorage";
import { deleteEntry, importRecord, putEntry, readDictionary, saveAnswer, subscribeDictionary, writeDictionary, type EntryInput } from "./entries";
import type { LibraryRecord } from "./reference";

export function useDictionary() {
  const store = useOsStore();
  const [data, setData] = useState(() => readDictionary(store));
  useEffect(() => {
    const refresh = () => setData(readDictionary(store));
    const unsubscribe = subscribeDictionary(store, refresh);
    window.addEventListener("storage", refresh);
    return () => { unsubscribe(); window.removeEventListener("storage", refresh); };
  }, [store]);
  return {
    data,
    put: (input: EntryInput) => {
      const result = putEntry(readDictionary(store), input);
      if (!result.error) writeDictionary(store, result.data);
      return result;
    },
    import: (reference: LibraryRecord, groups: string[]) => {
      const result = importRecord(readDictionary(store), reference, groups);
      if (!result.error) writeDictionary(store, result.data);
      return result;
    },
    remove: (id: string) => writeDictionary(store, deleteEntry(readDictionary(store), id)),
    answer: (id: string, correct: boolean) => saveAnswer(store, id, correct),
  };
}
