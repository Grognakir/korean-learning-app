"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applySm2, type Sm2Rating } from "./sm2";

export async function recordReview(wordId: string, rating: Sm2Rating) {
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

  const { data: existing, error: readError } = await supabase
    .from("word_progress")
    .select("ease_factor, interval_days, repetitions")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  if (readError) return { error: readError.message };

  const now = new Date();
  const result = applySm2(
    existing
      ? {
          easeFactor: existing.ease_factor,
          intervalDays: existing.interval_days,
          repetitions: existing.repetitions,
        }
      : { easeFactor: 2.5, intervalDays: 0, repetitions: 0 },
    rating,
    now,
  );

  const { error } = await supabase.from("word_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      due_at: result.dueAt.toISOString(),
      last_reviewed_at: now.toISOString(),
      last_rating: rating,
    },
    { onConflict: "user_id,word_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/");
  return { ok: true };
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
