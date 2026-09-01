import "server-only";
import { cache } from "react";
import type { Language } from "@/features/dictionary/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Активный язык обучения текущего пользователя. cache() дедуплицирует
 * повторные вызовы в пределах одного запроса (layout.tsx и вложенная
 * page.tsx оба его читают независимо — в App Router данные layout'а не
 * передаются странице автоматически).
 */
export const getActiveLanguage = cache(async (): Promise<Language> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "ko";

  const { data } = await supabase
    .from("profiles")
    .select("active_language")
    .eq("id", user.id)
    .single();

  return (data?.active_language as Language | undefined) ?? "ko";
});
