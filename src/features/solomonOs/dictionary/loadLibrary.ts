import { createClient } from "@/lib/supabase/client";
import { escapeLike, quoteForOrFilter } from "@/lib/supabase/escapeLike";
import { wordsSource } from "@/features/dictionary/wordSearch";
import { GRAMMAR_COLUMNS } from "@/features/dictionary/grammarColumns";
import type { GrammarPoint, Phrase, Word } from "@/features/dictionary/types";
import { fromGrammar, fromPhrase, fromWord, type EntryKind, type LibraryRecord } from "./reference";

export const LIBRARY_PAGE_SIZE = 20;
export async function loadLibrary(kind: EntryKind, search: string, page: number, sourceId?: string, exact = false): Promise<{ records: LibraryRecord[]; count: number }> {
  const client = createClient();
  const pattern = `%${escapeLike(search.trim())}%`;
  const range = [(page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE - 1] as const;
  if (kind === "word") {
    const select = "id, headword, reading, part_of_speech, owner_user_id, translations(text), word_categories(categories(id, name)), word_examples(kr, ru), word_notes(text), word_forms(label, value)";
    let request = (sourceId || exact ? client.from("words").select(select, { count: "exact" }) : wordsSource(client, select, search))
      .is("owner_user_id", null).order("headword").order("id").range(...range);
    if (sourceId) request = request.eq("id", sourceId);
    else if (exact) request = request.eq("headword", search.trim().normalize("NFC"));
    const result = await request;
    if (result.error) throw result.error;
    return { records: (result.data as unknown as Word[] ?? []).map(fromWord), count: result.count ?? 0 };
  }
  if (kind === "phrase") {
    let request = client.from("phrases").select("id, phrase_kr, reading, translation, usage_note, category, owner_user_id", { count: "exact" })
      .is("owner_user_id", null).order("phrase_kr").order("id").range(...range);
    if (sourceId) request = request.eq("id", sourceId);
    else if (exact) request = request.eq("phrase_kr", search.trim().normalize("NFC"));
    else if (search.trim()) request = request.or(`phrase_kr.ilike.${quoteForOrFilter(pattern)},translation.ilike.${quoteForOrFilter(pattern)}`);
    const result = await request;
    if (result.error) throw result.error;
    return { records: (result.data as Phrase[] ?? []).map(fromPhrase), count: result.count ?? 0 };
  }
  let request = client.from("grammar_points").select(GRAMMAR_COLUMNS, { count: "exact" })
    .is("owner_user_id", null).order("pattern").order("id").range(...range);
  if (sourceId) request = request.eq("id", sourceId);
  else if (exact) request = request.eq("pattern", search.trim().normalize("NFC"));
  else if (search.trim()) request = request.or(`pattern.ilike.${quoteForOrFilter(pattern)},short_desc.ilike.${quoteForOrFilter(pattern)}`);
  const result = await request;
  if (result.error) throw result.error;
  return { records: (result.data as unknown as GrammarPoint[] ?? []).map(fromGrammar), count: result.count ?? 0 };
}
