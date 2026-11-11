import "server-only";
import type { requireUser } from "@/features/auth/requireUser";
import {
  applyDictionaryTranslations,
  collectVocabKeys,
  joinDictionaryTranslations,
  type DictionaryTranslations,
} from "@/features/learning/dictionaryTranslations";
import type { Block } from "@/features/learning/types";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

const CHUNK = 120;

/** Подставляет в слова блоков (`vocab_list`, `vocab`, `extra_words` …) переводы
 * из общего словаря (`words` без владельца); остальное остаётся как в уроке. */
export async function resolveBlockVocab(supabase: Supabase, blocks: Block[]): Promise<Block[]> {
  const headwords = Array.from(collectVocabKeys(blocks));
  if (headwords.length === 0) return blocks;

  const dictionary: DictionaryTranslations = new Map();
  for (let i = 0; i < headwords.length; i += CHUNK) {
    const { data } = await supabase
      .from("words")
      .select("headword, translations(external_id, text)")
      .is("owner_user_id", null)
      .in("headword", headwords.slice(i, i + CHUNK));
    for (const row of data ?? []) {
      const text = joinDictionaryTranslations(
        (row.translations ?? []) as { external_id?: string | null; text: string }[],
      );
      if (text) dictionary.set(row.headword as string, text);
    }
  }
  return applyDictionaryTranslations(blocks, dictionary);
}
