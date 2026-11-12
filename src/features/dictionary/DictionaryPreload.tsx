"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDictionaryCache } from "./DictionaryCacheContext";
import { firstWordsPageKey, listPageKey } from "./queries";

// Предзагрузка нужна только там, где словарь рядом; на входе и в Solomon OS
// она лишь занимает сеть.
const SKIP_PREFIXES = ["/login", "/register", "/os"];
const skipsPreload = (path: string | null) =>
  Boolean(path) && SKIP_PREFIXES.some((prefix) => path === prefix || path!.startsWith(`${prefix}/`));

function whenIdle(task: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 200);
  return () => window.clearTimeout(id);
}

export function DictionaryPreload({ userId }: { userId: string | null }) {
  const { requestCachedResults, resultsGeneration } = useDictionaryCache();
  const router = useRouter();
  const pathname = usePathname();
  const skip = skipsPreload(pathname);
  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    const supabase = createClient();
    const sections = [
      {
        key: firstWordsPageKey(userId),
        run: () => supabase.from("words").select("id, headword, reading, part_of_speech, owner_user_id, translations(text), word_categories(categories(id, name)), word_examples(kr, ru), word_notes(text), word_forms(label, value)", { count: "exact" }).order("headword", { ascending: true }).order("id", { ascending: true }).range(0, 9),
      },
      ...[
        {
          key: listPageKey("phrases", "", "", 1),
          run: () => supabase.from("phrases").select("id, phrase_kr, reading, translation, usage_note, category, owner_user_id", { count: "exact" }).order("phrase_kr", { ascending: true }).range(0, 14).is("owner_user_id", null),
        },
        {
          key: listPageKey("grammar", "", "", 1),
          run: () => supabase.from("grammar_points").select("id, pattern, short_desc, category, grammar_group, lesson_label, lessons, explanation, usage, rules, examples, vocab, notes, owner_user_id", { count: "exact" }).order("pattern", { ascending: true }).range(0, 14).is("owner_user_id", null),
        },
      ],
    ];
    async function preload() {
      for (const section of sections) {
        if (cancelled) return;
        try { await requestCachedResults(section.key, section.run); } catch { continue; }
      }
      if (!cancelled) router.prefetch("/dictionary");
    }
    const cancelIdle = whenIdle(() => { void preload(); });
    return () => { cancelled = true; cancelIdle(); };
  }, [userId, requestCachedResults, resultsGeneration, router, skip]);
  return null;
}
