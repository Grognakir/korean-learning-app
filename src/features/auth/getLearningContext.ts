import "server-only";
import { cookies } from "next/headers";
import { readGuestLanguage } from "@/features/language/getActiveLanguage";
import { displayName, getAuthUser, getProfileRow } from "./requireUser";
import type { Language } from "@/features/dictionary/types";

export async function getLearningContext() {
  const { supabase, user } = await getAuthUser();
  const profile = user ? await getProfileRow(user.id) : null;
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
