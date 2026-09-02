import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Language } from "@/features/dictionary/types";
import { createClient } from "@/lib/supabase/server";

export const GUEST_LANGUAGE_COOKIE = "guest_language";

/** Язык гостя — хранится в cookie, не в БД (у гостя нет строки profiles). */
export async function readGuestLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_LANGUAGE_COOKIE)?.value === "en" ? "en" : "ko";
}

/**
 * Активный язык обучения текущего пользователя (или гостя). cache()
 * дедуплицирует повторные вызовы в пределах одного запроса (layout.tsx и
 * вложенная page.tsx оба его читают независимо — в App Router данные
 * layout'а не передаются странице автоматически).
 */
export const getActiveLanguage = cache(async (): Promise<Language> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return readGuestLanguage();

  const { data } = await supabase
    .from("profiles")
    .select("active_language")
    .eq("id", user.id)
    .single();

  return (data?.active_language as Language | undefined) ?? "ko";
});
