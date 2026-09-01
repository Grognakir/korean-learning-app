"use server";

import { createClient } from "@/lib/supabase/server";
import { generateWordDraft } from "./ai";
import { wordDraftSchema } from "./schemas";
import type { WordDraft } from "./types";

export async function generateWordDraftAction(input: string) {
  if (!input.trim()) return { error: "Введите слово" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  const { data: categoryRows } = await supabase.from("categories").select("name");

  try {
    const draft = await generateWordDraft(
      input,
      (categoryRows ?? []).map((c) => c.name),
    );
    return { draft };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// Форма payload для save_word/update_word — см. миграцию
// 20260901120000_dictionary_ownership.sql.
function toPayload(draft: WordDraft) {
  return {
    headword: draft.headword,
    reading: draft.reading,
    partOfSpeech: draft.partOfSpeech,
    translation: draft.translation,
    notes: draft.notes,
    examples: draft.examples,
    categories: draft.categories,
  };
}

// Слово, категории, перевод, заметки и примеры пишутся одной транзакцией
// внутри RPC: раньше это были отдельные запросы, и упавший на середине
// сценарий оставлял в базе слово без перевода.
export async function saveWord(draft: WordDraft) {
  const parsed = wordDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  const { error } = await supabase.rpc("save_word", {
    payload: toPayload(parsed.data),
  });
  if (error) return { error: error.message };

  return { success: true as const };
}

export async function updateWord(wordId: string, draft: WordDraft) {
  const parsed = wordDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  const { error } = await supabase.rpc("update_word", {
    target_word_id: wordId,
    payload: toPayload(parsed.data),
  });
  if (error) return { error: error.message };

  return { success: true as const };
}

export async function deleteWord(wordId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  // Дочерние строки уходят по on delete cascade. Фильтр по владельцу
  // здесь не вместо RLS, а чтобы отличить «нет прав» от «уже удалено»:
  // без него запрос вернул бы пустой результат в обоих случаях.
  const { data, error } = await supabase
    .from("words")
    .delete()
    .eq("id", wordId)
    .eq("owner_user_id", user.id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Слово не найдено" };

  return { success: true as const };
}
