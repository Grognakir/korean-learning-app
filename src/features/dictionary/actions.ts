"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateWordDraft } from "./ai";
import { DAILY_DRAFT_LIMIT, MAX_DRAFT_INPUT_LENGTH } from "./draftLimits";
import { wordDraftSchema } from "./schemas";
import type { WordDraft } from "./types";

const DRAFT_FAILED = "Не удалось получить черновик, попробуйте позже";

export async function generateWordDraftAction(input: string) {
  const parsed = z.string().trim().min(1).max(MAX_DRAFT_INPUT_LENGTH).safeParse(input);
  if (!parsed.success) {
    return { error: input.trim() ? `Слишком длинный запрос: не больше ${MAX_DRAFT_INPUT_LENGTH} символов` : "Введите слово" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  // Квота резервируется до обращения к провайдеру: сбой провайдера не
  // возвращает попытку, иначе повторными вызовами можно обойти лимит.
  const { data: used, error: quotaError } = await supabase.rpc("bump_ai_draft_usage");
  if (quotaError || typeof used !== "number") {
    console.error("bump_ai_draft_usage:", quotaError?.message);
    return { error: DRAFT_FAILED };
  }
  if (used > DAILY_DRAFT_LIMIT) {
    return { error: `Дневной лимит черновиков исчерпан (${DAILY_DRAFT_LIMIT}). Попробуйте завтра` };
  }

  const { data: categoryRows } = await supabase.from("categories").select("name");

  try {
    const draft = await generateWordDraft(
      parsed.data,
      (categoryRows ?? []).map((c) => c.name),
    );
    return { draft };
  } catch (e) {
    console.error("generateWordDraft:", (e as Error).message);
    return { error: DRAFT_FAILED };
  }
}

// Сообщения функций словаря (raise exception ... errcode 42501) написаны для
// пользователя по-русски и показываются как есть; любые другие ошибки базы
// (имена таблиц, ограничения) наружу не отдаём — только в журнал.
const WORD_ERROR = "Не удалось сохранить слово, попробуйте позже";
function wordError(label: string, error: { code?: string; message: string }) {
  if (error.code === "42501" && /[А-Яа-я]/.test(error.message)) return error.message;
  console.error(`${label}:`, error.message);
  return WORD_ERROR;
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
  if (error) return { error: wordError("save_word", error) };

  revalidatePath("/");
  return { success: true as const };
}

export async function updateWord(wordId: string, draft: WordDraft) {
  if (!z.uuid().safeParse(wordId).success) return { error: "Слово не найдено" };
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
  if (error) return { error: wordError("update_word", error) };

  revalidatePath("/");
  return { success: true as const };
}

export async function deleteWord(wordId: string) {
  if (!z.uuid().safeParse(wordId).success) return { error: "Слово не найдено" };
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
  if (error) return { error: wordError("deleteWord", error) };
  if (!data?.length) return { error: "Слово не найдено" };

  revalidatePath("/");
  return { success: true as const };
}
