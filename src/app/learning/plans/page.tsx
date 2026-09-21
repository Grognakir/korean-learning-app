import Link from "next/link";
import { displayName, getProfileRow, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { TOTAL_LESSONS } from "./constants";
import styles from "./learning.module.css";

export default async function PlansPage() {
  const { supabase, user } = await requireUser();

  const [profile, { data: textbooks, error }] = await Promise.all([
    getProfileRow(user.id),
    supabase
      .from("textbooks")
      .select("id, slug, title, level, learning_plans!inner(slug)")
      .eq("learning_plans.slug", "inha")
      .order("level"),
  ]);
  if (error) throw new Error("Не удалось загрузить учебники");

  const username = displayName(profile, user);

  const textbookIds = (textbooks ?? []).map((textbook) => textbook.id);
  const { data: lessonRows } = textbookIds.length
    ? await supabase.from("lessons").select("textbook_id").in("textbook_id", textbookIds)
    : { data: [] };

  const lessonCountByTextbook = new Map<string, number>();
  for (const row of lessonRows ?? []) {
    lessonCountByTextbook.set(
      row.textbook_id,
      (lessonCountByTextbook.get(row.textbook_id) ?? 0) + 1,
    );
  }

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <Link href="/learning" className={styles.backLink}>
          ← Назад
        </Link>

        <div className={styles.header}>
          <p className={styles.eyebrow}>План 인하대학교 · Учебники</p>
          <h1 className={styles.title}>Выберите учебник</h1>
        </div>

        <div className={styles.sectionGrid}>
          {(textbooks ?? []).map((textbook) => {
            const count = lessonCountByTextbook.get(textbook.id) ?? 0;
            return (
              <Link
                key={textbook.id}
                href={`/learning/plans/${textbook.slug}`}
                className={styles.sectionCard}
              >
                <span className={`${styles.sectionCardTitle} kr`}>
                  {textbook.title} · 급 {textbook.level}
                </span>
                <span className={styles.sectionCardMeta}>
                  {count > 0
                    ? `Доступно ${count} из ${TOTAL_LESSONS}`
                    : "Уроки скоро появятся"}
                </span>
              </Link>
            );
          })}
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
