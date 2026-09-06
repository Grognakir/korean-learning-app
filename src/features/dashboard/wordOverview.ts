import type { createClient } from "@/lib/supabase/server";
import type { Language } from "@/features/dictionary/types";

export type WordOverview = { total: number; reviewed: number; due: number };

export async function getWordOverview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  language: Language,
): Promise<WordOverview | null> {
  const progress = () => supabase.from("word_progress")
    .select("id, words!inner(language)", { count: "exact", head: true })
    .eq("user_id", userId).eq("words.language", language);
  try {
    const [total, reviewed, due] = await Promise.all([
      supabase.from("words").select("id", { count: "exact", head: true })
        .eq("language", language)
        .or(`owner_user_id.is.null,owner_user_id.eq.${userId}`),
      progress(),
      progress().lte("due_at", new Date().toISOString()),
    ]);
    if ([total, reviewed, due].some((result) => result.error || result.count === null)) return null;
    return { total: total.count!, reviewed: reviewed.count!, due: due.count! };
  } catch {
    return null;
  }
}
