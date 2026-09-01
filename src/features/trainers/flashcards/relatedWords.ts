import type { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";

// word_forms хранит связи антоним/синоним как обычный текст
// ("켜다 (включать)"), без FK на words (см. docs/database/schema.md) —
// резолвим целевое слово на чтении, а не храним дубликат в схеме.
export type RelatedPair = {
  wordId: string;
  relatedWordId: string;
  relationType: "antonym" | "synonym";
};

const RELATION_LABEL: Record<string, RelatedPair["relationType"]> = {
  антоним: "antonym",
  синоним: "synonym",
};

const TARGET_HEADWORD_RE = /^(.+?)\s*\(/;

// word_forms!inner(owner_user_id) — связь many-to-one, PostgREST отдаёт
// одиночный объект, а не массив; но без сгенерированных DB-типов клиент
// типизирует embed как массив (см. relatedWords.ts истории правок) —
// нормализуем оба варианта на всякий случай.
function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function resolveRelatedWordPairs(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<RelatedPair[]> {
  const [words, forms] = await Promise.all([
    fetchAllRows<{ id: string; headword: string }>((from, to) =>
      supabase
        .from("words")
        .select("id, headword")
        .is("owner_user_id", null)
        .range(from, to),
    ),
    fetchAllRows<{
      word_id: string;
      label: string | null;
      value: string;
      words: { owner_user_id: string | null } | { owner_user_id: string | null }[] | null;
    }>((from, to) =>
      supabase
        .from("word_forms")
        .select("word_id, label, value, words!inner(owner_user_id)")
        .in("label", Object.keys(RELATION_LABEL))
        .range(from, to),
    ),
  ]);

  const headwordToIds = new Map<string, string[]>();
  for (const word of words) {
    const ids = headwordToIds.get(word.headword) ?? [];
    ids.push(word.id);
    headwordToIds.set(word.headword, ids);
  }

  const pairs: RelatedPair[] = [];
  for (const form of forms) {
    const relationType = RELATION_LABEL[form.label ?? ""];
    const owner = asOne(form.words)?.owner_user_id;
    if (!relationType || owner !== null) continue;

    const match = TARGET_HEADWORD_RE.exec(form.value);
    if (!match) continue;

    const targetIds = headwordToIds.get(match[1]);
    if (!targetIds || targetIds.length !== 1) continue;

    pairs.push({
      wordId: form.word_id,
      relatedWordId: targetIds[0],
      relationType,
    });
  }

  return pairs;
}
