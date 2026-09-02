import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { DictionaryPageClient } from "@/features/dictionary/components/DictionaryPageClient";
import { readGuestLanguage } from "@/features/language/getActiveLanguage";
import type { Language } from "@/features/dictionary/types";
import styles from "./dictionary.module.css";

export default async function DictionaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let language: Language = "ko";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, active_language")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? user.email ?? "Пользователь";
    language = (profile?.active_language as Language | undefined) ?? "ko";
  } else {
    language = await readGuestLanguage();
  }

  // Фразы/грамматика — только корейский контент, для английского трека эти
  // запросы не нужны вовсе.
  const [{ data: categories }, phraseGrammar] = await Promise.all([
    supabase.from("categories").select("id, name").eq("language", language).order("name"),
    language === "ko"
      ? Promise.all([
          supabase.from("phrases").select("category").not("category", "is", null),
          supabase.from("grammar_points").select("category"),
        ])
      : Promise.resolve([{ data: [] }, { data: [] }] as const),
  ]);
  const [{ data: phraseCategoryRows }, { data: grammarCategoryRows }] = phraseGrammar;
  const phraseCategories = Array.from(
    new Set((phraseCategoryRows ?? []).map((r) => r.category as string)),
  ).sort((a, b) => a.localeCompare(b, "ru"));
  const grammarCategories = Array.from(
    new Set((grammarCategoryRows ?? []).map((r) => r.category as string)),
  ).sort((a, b) => a.localeCompare(b, "ru"));

  return (
    <div className={styles.page}>
      {user ? <AppHeader username={username!} /> : <GuestHeader />}

      <main className={styles.wrap}>
        <DictionaryPageClient
          categories={categories ?? []}
          phraseCategories={phraseCategories}
          grammarCategories={grammarCategories}
          userId={user?.id ?? null}
          language={language}
        />
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
