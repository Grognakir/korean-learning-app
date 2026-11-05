"use client";

import { useEffect, useState } from "react";
import { loadLibrary } from "./loadLibrary";
import type { EntryKind, LibraryRecord } from "./reference";

export function useTranslationAutofill(ko: string, kind: EntryKind, enabled: boolean) {
  const query = ko.trim().normalize("NFC"), key = `${kind}:${query}`;
  const [match, setMatch] = useState<{ key: string; record?: LibraryRecord }>();
  useEffect(() => {
    if (!enabled || !/[\uac00-\ud7af]/u.test(query)) return;
    let active = true;
    const timer = window.setTimeout(() => {
      loadLibrary(kind, query, 1, undefined, true).then(({ records }) => {
        if (active) setMatch({ key, record: records.find((record) => record.ko.trim().normalize("NFC") === query && record.ru.trim()) });
      }).catch(() => { if (active) setMatch({ key }); });
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [enabled, key, kind, query]);
  return enabled && match?.key === key ? match.record : undefined;
}
