import { escapeLike } from "@/lib/supabase/escapeLike";
import type { createClient } from "@/lib/supabase/client";

type Client = ReturnType<typeof createClient>;

// Короткий запрос ищет только по написанию: один символ встречается в
// сотнях переводов и ничего не уточняет.
export const TRANSLATION_SEARCH_MIN_LENGTH = 2;

/**
 * Источник строк `words` для постраничного списка: при непустом поиске —
 * функция search_words (написание ИЛИ перевод на стороне базы), иначе
 * обычная таблица. Дальше к результату применяются те же фильтры,
 * сортировка и range.
 */
export function wordsSource(supabase: Client, select: string, term: string) {
  const search = term.trim();
  if (search.length >= TRANSLATION_SEARCH_MIN_LENGTH) {
    return supabase
      .rpc("search_words", { q: search }, { count: "exact", get: true })
      .select(select) as unknown as ReturnType<ReturnType<Client["from"]>["select"]>;
  }
  const request = supabase.from("words").select(select, { count: "exact" });
  return search ? request.ilike("headword", `%${escapeLike(search)}%`) : request;
}
