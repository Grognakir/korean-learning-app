import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Language } from "@/features/dictionary/types";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { mix, selectPracticeWords } from "./exercises";

export async function loadPracticeWords(supabase: Awaited<ReturnType<typeof createClient>>, language: Language) {
  const rows = await fetchAllRows<{ id: string; headword: string; translations: { text: string }[] }>((from, to) =>
    supabase.from("words").select("id, headword, translations(text)").eq("language", language).is("owner_user_id", null).order("id").range(from, to),
  );
  return mix(selectPracticeWords(rows, language)).slice(0, 12);
}
