import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Language } from "@/features/dictionary/types";
import { getAuthUser, getProfileRow } from "@/features/auth/requireUser";

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
 * layout'а не передаются странице автоматически); getAuthUser/getProfileRow
 * сами тоже мемоизированы, так что этот вызов не добавляет собственных
 * сетевых запросов сверх того, что уже сделал кто-то ещё в этом request'е.
 */
export const getActiveLanguage = cache(async (): Promise<Language> => {
  const { user } = await getAuthUser();
  if (!user) return readGuestLanguage();

  const profile = await getProfileRow(user.id);
  return (profile?.active_language as Language | undefined) ?? "ko";
});
