import type { createClient } from "@/lib/supabase/server";
import type { Language, Word } from "@/features/dictionary/types";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { resolveRelatedWordPairs, type RelatedPair } from "./relatedWords";

// Тот же набор join'ов, что WordList.tsx использует для карточки слова в
// словаре — переиспользуем форму данных (translations/word_examples/
// word_notes/word_forms), только без пагинации: тренажёру нужен весь пул
// кандидатов сразу, а не постранично.
const WORD_SELECT =
  "id, headword, reading, part_of_speech, owner_user_id, language, translations(text), word_categories(categories(id, name)), word_examples(kr, ru), word_notes(text), word_forms(label, value)";

export type FlashcardQueueItem = { word: Word; isNew: boolean };

export async function buildFlashcardQueue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  newCardsLimit: number,
  language: Language,
  options: { categoryIds?: string[] } = {},
): Promise<FlashcardQueueItem[]> {
  const now = new Date().toISOString();

  const progressRows = await fetchAllRows<{ word_id: string; due_at: string }>(
    (from, to) =>
      supabase
        .from("word_progress")
        .select("word_id, due_at")
        .eq("user_id", userId)
        .range(from, to),
  );

  const seenWordIds = new Set(progressRows.map((r) => r.word_id));
  const dueWordIds = progressRows
    .filter((r) => r.due_at <= now)
    .map((r) => r.word_id);

  let categoryWordIds: Set<string> | null = null;
  if (options.categoryIds && options.categoryIds.length > 0) {
    const catRows = await fetchAllRows<{ word_id: string }>((from, to) =>
      supabase
        .from("word_categories")
        .select("word_id")
        .in("category_id", options.categoryIds!)
        .range(from, to),
    );
    categoryWordIds = new Set(catRows.map((r) => r.word_id));
  }

  const dueIdsInScope = categoryWordIds
    ? dueWordIds.filter((id) => categoryWordIds!.has(id))
    : dueWordIds;

  // word_progress не хранит язык — due-карты могут принадлежать другому
  // треку (переключились с корейского на английский), поэтому fetchWords
  // всё равно фильтрует по language, чтобы чужие due-карты не всплыли.
  const dueWords = dueIdsInScope.length
    ? await fetchWords(supabase, dueIdsInScope, language)
    : [];

  // Кандидаты в "новые" — только id, без join'ов: пул может быть большим
  // (весь глобальный словарь, 1000+ строк — упирается в max_rows, поэтому
  // fetchAllRows), а нужен из него только случайный срез размера
  // newCardsLimit. Фильтр по категории — пересечением в JS, а не через
  // .in() с сотнями id (упирается в лимит длины URL у PostgREST).
  // Берём и глобальные слова, и добавленные самим пользователем — иначе
  // своё слово из словаря никогда не попадало во флэшкарты.
  const candidateIds = await fetchAllRows<{ id: string }>((from, to) =>
    supabase
      .from("words")
      .select("id")
      .eq("language", language)
      .or(`owner_user_id.is.null,owner_user_id.eq.${userId}`)
      .range(from, to),
  );

  const newIds = shuffle(
    candidateIds
      .map((w) => w.id)
      .filter((id) => !seenWordIds.has(id))
      .filter((id) => !categoryWordIds || categoryWordIds.has(id)),
  ).slice(0, newCardsLimit);

  const newWords = newIds.length ? await fetchWords(supabase, newIds) : [];

  return [
    ...shuffle(dueWords).map((word) => ({ word, isNew: false })),
    ...newWords.map((word) => ({ word, isNew: true })),
  ];
}

// Режим «Антонимы/Синонимы»: слово и его пара всегда идут подряд. Пара
// активна в сессии, если хотя бы одна сторона due-или-новая — тогда
// показываются ОБЕ стороны, даже если due_at второй ещё не подошёл
// (иначе теряется смысл парного повторения).
export async function buildRelatedWordsQueue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  newCardsLimit: number,
): Promise<FlashcardQueueItem[]> {
  const pairs = await resolveRelatedWordPairs(supabase);
  if (!pairs.length) return [];

  const now = new Date().toISOString();
  const progressRows = await fetchAllRows<{ word_id: string; due_at: string }>(
    (from, to) =>
      supabase
        .from("word_progress")
        .select("word_id, due_at")
        .eq("user_id", userId)
        .range(from, to),
  );
  const progressByWord = new Map(progressRows.map((r) => [r.word_id, r.due_at]));

  const isNew = (wordId: string) => !progressByWord.has(wordId);
  const isDueOrNew = (wordId: string) => {
    const dueAt = progressByWord.get(wordId);
    return dueAt === undefined || dueAt <= now;
  };

  const seenPairKeys = new Set<string>();
  const eligiblePairs: RelatedPair[] = [];
  for (const pair of pairs) {
    const key = [pair.wordId, pair.relatedWordId].sort().join("|");
    if (seenPairKeys.has(key)) continue;
    if (!isDueOrNew(pair.wordId) && !isDueOrNew(pair.relatedWordId)) continue;
    seenPairKeys.add(key);
    eligiblePairs.push(pair);
  }

  // Лимит новых карт применяется только к парам, где хотя бы одна сторона
  // впервые встречается — пары, обе стороны которых уже на повторении, не
  // урезаются (это не "новые" слова, а плановые due-повторения).
  const duePairs = eligiblePairs.filter(
    (p) => !isNew(p.wordId) && !isNew(p.relatedWordId),
  );
  const newPairs = shuffle(
    eligiblePairs.filter((p) => isNew(p.wordId) || isNew(p.relatedWordId)),
  ).slice(0, newCardsLimit);
  const finalPairs = shuffle([...duePairs, ...newPairs]);

  const allIds = Array.from(
    new Set(finalPairs.flatMap((p) => [p.wordId, p.relatedWordId])),
  );
  const words = allIds.length ? await fetchWords(supabase, allIds) : [];
  const wordById = new Map(words.map((w) => [w.id, w]));

  const queue: FlashcardQueueItem[] = [];
  for (const pair of finalPairs) {
    const a = wordById.get(pair.wordId);
    const b = wordById.get(pair.relatedWordId);
    if (!a || !b) continue;
    queue.push({ word: a, isNew: isNew(pair.wordId) });
    queue.push({ word: b, isNew: isNew(pair.relatedWordId) });
  }
  return queue;
}

// PostgREST собирает .in(...) в query-строку GET-запроса — при большом
// списке id упирается в лимит длины URL ("URI too long"), поэтому бьём на
// чанки и запрашиваем их параллельно.
const ID_CHUNK_SIZE = 150;

async function fetchWords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
  language?: Language,
): Promise<Word[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + ID_CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      fetchAllRows<Word>((from, to) => {
        let query = supabase.from("words").select(WORD_SELECT).in("id", chunk);
        if (language) query = query.eq("language", language);
        return query.range(from, to) as unknown as PromiseLike<{
          data: Word[] | null;
          error: unknown;
        }>;
      }),
    ),
  );
  return results.flat();
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
