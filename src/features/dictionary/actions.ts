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

  const { data: word, error: wordError } = await supabase
    .from("words")
    .insert({
      owner_user_id: user.id,
      headword: parsed.data.headword,
      reading: parsed.data.reading,
      part_of_speech: parsed.data.partOfSpeech,
    })
    .select()
    .single();
  if (wordError) return { error: wordError.message };

  const categoryIds: string[] = [];
  for (const name of parsed.data.categories) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", name)
      .maybeSingle();
    let categoryId = existing?.id;
    if (!categoryId) {
      const { data: created, error: createError } = await supabase
        .from("categories")
        .insert({ name })
        .select()
        .single();
      if (createError) return { error: createError.message };
      categoryId = created.id;
    }
    categoryIds.push(categoryId);
  }

  if (categoryIds.length) {
    const { error } = await supabase.from("word_categories").insert(
      categoryIds.map((category_id) => ({
        word_id: word.id,
        category_id,
      })),
    );
    if (error) return { error: error.message };
  }

  const { error: translationError } = await supabase
    .from("translations")
    .insert({ word_id: word.id, text: parsed.data.translation });
  if (translationError) return { error: translationError.message };

  if (parsed.data.notes) {
    const { error } = await supabase
      .from("word_notes")
      .insert({ word_id: word.id, text: parsed.data.notes });
    if (error) return { error: error.message };
  }

  if (parsed.data.examples.length) {
    const { error } = await supabase.from("word_examples").insert(
      parsed.data.examples.map((e) => ({
        word_id: word.id,
        kr: e.kr,
        ru: e.ru,
      })),
    );
    if (error) return { error: error.message };
  }

  return { success: true as const };
}
