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

  const chunks: string[][] = [];
  for (let i = 0; i < headwords.length; i += CHUNK) chunks.push(headwords.slice(i, i + CHUNK));

  // Чанки запрашиваются параллельно. Ошибка запроса не должна тихо
  // возвращать переводы из JSON урока: пользователь увидел бы устаревший
  // перевод вместо словарного, поэтому ошибка пробрасывается.
  const results = await Promise.all(
    chunks.map((chunk) =>
      supabase
        .from("words")
        .select("headword, translations(external_id, text)")
        .is("owner_user_id", null)
        .in("headword", chunk),
    ),
  );

  const dictionary: DictionaryTranslations = new Map();
  for (const { data, error } of results) {
    if (error) throw new Error(`words: ${error.message}`);
    for (const row of data ?? []) {
      const text = joinDictionaryTranslations(
        (row.translations ?? []) as { external_id?: string | null; text: string }[],
      );
      if (text) dictionary.set(row.headword as string, text);
    }
  }
  return applyDictionaryTranslations(blocks, dictionary);
}
