"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDictionaryCache } from "./DictionaryCacheContext";
import type { Language } from "./types";

export function DictionaryPreload({ userId, language }: { userId: string | null; language: Language }) {
  const { requestCachedResults, resultsGeneration } = useDictionaryCache();
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const sections = [
      {
        key: JSON.stringify({ debouncedQuery: "", sortDir: "asc", pageSize: 10, page: 1, partOfSpeech: "", categoryId: "", ownership: "all", userId, language }),
        run: () => supabase.from("words").select("id, headword, reading, part_of_speech, owner_user_id, language, translations(text), word_categories(categories(id, name)), word_examples(kr, ru), word_notes(text), word_forms(label, value)", { count: "exact" }).eq("language", language).order("headword", { ascending: true }).order("id", { ascending: true }).range(0, 9),
      },
      ...(language === "ko" ? [
        {
          key: JSON.stringify({ section: "phrases", debouncedQuery: "", category: "", page: 1 }),
          run: () => supabase.from("phrases").select("id, phrase_kr, reading, translation, usage_note, category, owner_user_id", { count: "exact" }).order("phrase_kr", { ascending: true }).range(0, 14).is("owner_user_id", null),
        },
        {
          key: JSON.stringify({ section: "grammar", debouncedQuery: "", category: "", page: 1 }),
          run: () => supabase.from("grammar_points").select("id, pattern, short_desc, category, grammar_group, lesson_label, lessons, explanation, usage, rules, examples, vocab, owner_user_id", { count: "exact" }).order("pattern", { ascending: true }).range(0, 14).is("owner_user_id", null),
        },
      ] : []),
    ];
    async function preload() {
      for (const section of sections) {
        if (cancelled) return;
        try { await requestCachedResults(section.key, section.run); } catch { continue; }
      }
      if (!cancelled) router.prefetch("/dictionary");
    }
    void preload();
    return () => { cancelled = true; };
  }, [userId, language, requestCachedResults, resultsGeneration, router]);
  return null;
}
