import Link from "next/link";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { buildFlashcardQueue } from "@/features/trainers/flashcards/buildQueue";
import { CategorySelect } from "@/features/trainers/flashcards/components/CategorySelect";
import { FlashcardSession } from "@/features/trainers/flashcards/components/FlashcardSession";
import { FlashcardsHeader } from "@/features/trainers/flashcards/components/FlashcardsHeader";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import layout from "../../learning.module.css";
import styles from "./flashcards.module.css";

type CategoryRow = {
  categories: { id: string; name: string } | { id: string; name: string }[] | null;
  words: { owner_user_id: string | null } | { owner_user_id: string | null }[] | null;
};

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseCategoryIds(param: string | string[] | undefined): string[] {
  if (!param) return [];
  const raw = Array.isArray(param) ? param.join(",") : param;
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

export default async function FlashcardsMainPage({
  searchParams,
}: {
  searchParams: Promise<{ categories?: string | string[] }>;
}) {
  const { categories: categoriesParam } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, srs_new_cards_per_session")
    .eq("id", user.id)
    .single();
  const username = displayName(profile, user);
  const newCardsLimit = profile?.srs_new_cards_per_session ?? 20;

  const rows = await fetchAllRows<CategoryRow>((from, to) =>
    supabase
      .from("word_categories")
      .select("categories(id, name), words!inner(owner_user_id)")
      .range(from, to),
  );

  const categories = new Map<string, string>();
  for (const row of rows) {
    const word = asOne(row.words);
    if (word?.owner_user_id !== null && word?.owner_user_id !== undefined) {
      continue;
    }
    const category = asOne(row.categories);
    if (category) categories.set(category.id, category.name);
  }
  const categoryList = Array.from(categories, ([id, name]) => ({ id, name })).sort(
    (a, b) => a.name.localeCompare(b.name, "ru"),
  );

  const selectedCategoryIds = parseCategoryIds(categoriesParam).filter((id) =>
    categories.has(id),
  );
  const queue = await buildFlashcardQueue(supabase, user.id, newCardsLimit, {
    categoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
  });

  return (
    <div className={layout.page}>
      <AppHeader username={username} />
      <main className={`${layout.wrap} ${styles.wrap}`}>
        <Link href="/learning/trainers" className={layout.backLink}>
          ← Назад
        </Link>
        <h1 className={layout.title}>Карточки слов</h1>
        <div className={styles.column}>
          <FlashcardsHeader active="main" newCardsLimit={newCardsLimit} />
          <CategorySelect categories={categoryList} selectedIds={selectedCategoryIds} />
          <FlashcardSession
            key={selectedCategoryIds.slice().sort().join(",") || "all"}
            queue={queue}
          />
        </div>
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
