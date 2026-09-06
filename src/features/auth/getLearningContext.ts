import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { readGuestLanguage } from "@/features/language/getActiveLanguage";
import { displayName } from "./requireUser";
import type { Language } from "@/features/dictionary/types";

export async function getLearningContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("username, active_language, srs_new_cards_per_session").eq("id", user.id).single()
    : { data: null };
  const guestLimit = Number((await cookies()).get("guest_new_cards_limit")?.value ?? 20);
  const newCardsLimit = user
    ? profile?.srs_new_cards_per_session ?? 20
    : Number.isFinite(guestLimit) ? Math.min(50, Math.max(5, Math.round(guestLimit))) : 20;
  return {
    supabase, user,
    username: user ? displayName(profile, user) : null,
    activeLanguage: user ? (profile?.active_language as Language | undefined) ?? "ko" : await readGuestLanguage(),
    newCardsLimit,
  };
}
