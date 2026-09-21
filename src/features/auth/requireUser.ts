import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/features/dictionary/types";

/**
 * supabase.auth.getUser() — настоящий сетевой запрос к Auth-серверу
 * (проверяет JWT по сети, а не декодирует локально), и без мемоизации
 * каждый layout/page/компонент, которому нужен пользователь, бил бы в
 * сеть отдельно на одну навигацию. cache() гарантирует один вызов на
 * server-render независимо от того, сколько мест его запросили.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

/**
 * Строка profiles — единый широкий select, покрывающий все колонки,
 * которые разные страницы раньше выбирали по отдельности (username,
 * язык обучения, шрифты, лимит новых карточек). Кэш ключуется на userId
 * (примитив), не на объект supabase — так разные вызовы гарантированно
 * попадают в один и тот же кэш-слот за один request.
 */
export const getProfileRow = cache(async (userId: string) => {
  const { supabase } = await getAuthUser();
  const { data } = await supabase
    .from("profiles")
    .select("username, active_language, font_ui, font_kr, srs_new_cards_per_session")
    .eq("id", userId)
    .single();
  return data;
});

/**
 * Клиент Supabase и текущий пользователь; гостя уводит на /login.
 * Отдельно от requireUserWithProfile — страницам, которые тянут профиль
 * вместе с другими запросами в Promise.all, нужен именно клиент, чтобы
 * не превращать параллельные запросы в последовательные.
 */
export async function requireUser() {
  const { supabase, user } = await getAuthUser();
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
  const profile = await getProfileRow(user.id);

  return {
    supabase,
    user,
    username: displayName(profile, user),
    activeLanguage: (profile?.active_language as Language | undefined) ?? "ko",
  };
}
