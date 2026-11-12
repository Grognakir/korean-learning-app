"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applySrs, type SrsRating } from "./srs";

const MAX_WRITE_ATTEMPTS = 3;
const UNIQUE_VIOLATION = "23505";

export async function recordReview(wordId: string, rating: SrsRating) {
  const parsed = z.object({
    wordId: z.uuid(),
    rating: z.enum(["again", "hard", "good", "easy"]),
  }).safeParse({ wordId, rating });
  if (!parsed.success) return { error: "Некорректное слово или оценка" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  // Условная запись по version: параллельный ответ по тому же слову не
  // затирается, а перечитывает состояние и считает от него.
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const { data: existing, error: readError } = await supabase
      .from("word_progress")
      .select("interval_days, repetitions, version")
      .eq("user_id", user.id)
      .eq("word_id", wordId)
      .maybeSingle();

    if (readError) return { error: readError.message };

    const now = new Date();
    const result = applySrs(
      existing
        ? { intervalDays: existing.interval_days, repetitions: existing.repetitions }
        : { intervalDays: 0, repetitions: 0 },
      rating,
      now,
    );
    const values = {
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      due_at: result.dueAt.toISOString(),
      last_reviewed_at: now.toISOString(),
      last_rating: rating,
      updated_at: now.toISOString(),
    };

    if (existing) {
      const { data: updated, error } = await supabase
        .from("word_progress")
        .update({ ...values, version: existing.version + 1 })
        .eq("user_id", user.id)
        .eq("word_id", wordId)
        .eq("version", existing.version)
        .select("id");
      if (error) return { error: error.message };
      if (updated && updated.length > 0) return { ok: true };
      continue;
    }

    const { error } = await supabase
      .from("word_progress")
      .insert({ user_id: user.id, word_id: wordId, ...values });
    if (!error) return { ok: true };
    if (error.code !== UNIQUE_VIOLATION) return { error: error.message };
  }

  return { error: "Не удалось сохранить ответ, повторите" };
}

export async function updateNewCardsLimit(limit: number) {
  if (!z.number().safeParse(limit).success) {
    return { error: "Некорректный лимит новых карточек" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const clamped = Math.min(50, Math.max(5, Math.round(limit)));
  if (!user) {
    (await cookies()).set("guest_new_cards_limit", String(clamped), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    revalidatePath("/learning/trainers/flashcards");
    revalidatePath("/learning/trainers/flashcards/antonyms-synonyms");
    return { ok: true, limit: clamped };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ srs_new_cards_per_session: clamped })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/learning/trainers/flashcards");
  revalidatePath("/learning/trainers/flashcards/antonyms-synonyms");
  return { ok: true, limit: clamped };
}
