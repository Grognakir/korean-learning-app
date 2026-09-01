"use server";

import { createClient } from "@/lib/supabase/server";
import { generateWordDraft } from "./ai";
import { wordDraftSchema } from "./schemas";
import type { WordDraft } from "./types";

// AI-подсказка (ai.ts) заточена под корейский — UI прячет вкладку "Через
// AI" в английском треке, но фильтр здесь на всякий случай не зависит от
// того, что показывает клиент.
export async function generateWordDraftAction(input: string) {
  if (!input.trim()) return { error: "Введите слово" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name")
    .eq("language", "ko");

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
function toPayload(draft: WordDraft, language?: string) {
  return {
    headword: draft.headword,
    reading: draft.reading,
    partOfSpeech: draft.partOfSpeech,
    translation: draft.translation,
    notes: draft.notes,
    examples: draft.examples,
    categories: draft.categories,
    ...(language ? { language } : {}),
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

  // Язык нового слова — активный трек пользователя, читаем на сервере,
  // а не доверяем клиенту (save_word сам подставит 'ko', если не передать).
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_language")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.rpc("save_word", {
    payload: toPayload(parsed.data, profile?.active_language ?? "ko"),
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
