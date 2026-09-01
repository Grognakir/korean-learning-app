import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/features/dictionary/types";

/**
 * Клиент Supabase и текущий пользователь; гостя уводит на /login.
 * Отдельно от requireUserWithProfile — страницам, которые тянут профиль
 * вместе с другими запросами в Promise.all, нужен именно клиент, чтобы
 * не превращать параллельные запросы в последовательные.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Имя в шапке: username из профиля, иначе email. */
export function displayName(
  profile: { username?: string | null } | null | undefined,
  user: User,
): string {
  return profile?.username ?? user.email ?? "Пользователь";
}

/** Частый случай: из профиля нужны username и активный язык обучения. */
export async function requireUserWithProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, active_language")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    user,
    username: displayName(profile, user),
    activeLanguage: (profile?.active_language as Language | undefined) ?? "ko",
  };
}
