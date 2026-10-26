import { getAuthUser, getProfileRow } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { DictionaryPageClient } from "@/features/dictionary/components/DictionaryPageClient";
import {
  parseDictionaryQuery,
  parseDictionaryTab,
} from "@/features/dictionary/dictionarySearchUrl";
import styles from "./dictionary.module.css";

// Категории вида "1. ...", "10. ...", "11. ..." — localeCompare сравнивает
// их как строки ("1" < "10" < "11" < "2"), нужен порядок по номеру.
function compareCategoryNames(a: string, b: string): number {
  const na = Number(a.match(/^\d+/)?.[0]);
  const nb = Number(b.match(/^\d+/)?.[0]);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) {
    return na - nb || a.localeCompare(b, "ru");
  }
  return a.localeCompare(b, "ru");
}

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialTab = parseDictionaryTab(params.tab);
  const initialGrammarQuery =
    initialTab === "grammar" ? parseDictionaryQuery(params.q) : "";
  const { supabase, user } = await getAuthUser();

  let username: string | null = null;
  if (user) {
    const profile = await getProfileRow(user.id);
    username = profile?.username ?? user.email ?? "Пользователь";
  }

  const [{ data: categories }, { data: phraseCategoryRows }, { data: grammarCategoryRows }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("phrases").select("category").not("category", "is", null),
    supabase.from("grammar_points").select("category"),
  ]);
  const phraseCategories = Array.from(
    new Set((phraseCategoryRows ?? []).map((r) => r.category as string)),
  ).sort(compareCategoryNames);
  const grammarCategories = Array.from(
    new Set((grammarCategoryRows ?? []).map((r) => r.category as string)),
  ).sort(compareCategoryNames);

  return (
    <div className={styles.page}>
      {user ? <AppHeader username={username!} /> : <GuestHeader />}

      <main className={styles.wrap}>
        <DictionaryPageClient
          categories={categories ?? []}
          phraseCategories={phraseCategories}
          grammarCategories={grammarCategories}
          userId={user?.id ?? null}
          initialTab={initialTab}
          initialGrammarQuery={initialGrammarQuery}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
