import Link from "next/link";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { LessonList, type LessonListItem } from "./LessonList";
import styles from "./learning.module.css";

// docs/dev_docs/3-dictionary-and-learning.md: учебник — 16 уроков; сейчас
// импортирован только урок 1 (docs/reference/inha_book_1_content), 2-16
// появятся тем же импорт-скриптом по мере авторства контента.
const TOTAL_LESSONS = 16;

export default async function PlansPage() {
  const { supabase, user } = await requireUser();

  // Раньше номера уроков приходили embed'ом textbook_pages(lesson_number)
  // внутри запроса учебника — такой embed упирается в max_rows (1000) и
  // молча обрезал бы список уроков при импорте новых. fetchAllRows
  // пагинирует, как в остальных местах проекта.
  const [{ data: profile }, { data: textbook }, pageRows] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase
      .from("textbooks")
      .select("id, title, level")
      .eq("slug", "inha-1")
      .single(),
    fetchAllRows<{ lesson_number: number }>((from, to) =>
      supabase
        .from("textbook_pages")
        .select("lesson_number, textbooks!inner(slug)")
        .eq("textbooks.slug", "inha-1")
        .range(from, to),
    ),
  ]);

  const username = displayName(profile, user);

  const { data: lessons } = textbook?.id
    ? await supabase
        .from("lessons")
        .select("lesson_number, title")
        .eq("textbook_id", textbook.id)
    : { data: null };

  const availableLessons = new Set(pageRows.map((page) => page.lesson_number));

  const lessonTitles = new Map(
    (lessons ?? []).map((lesson) => [lesson.lesson_number, lesson.title]),
  );

  const lessonItems: LessonListItem[] = Array.from(
    { length: TOTAL_LESSONS },
    (_, i) => {
      const lessonNumber = i + 1;
      const title = lessonTitles.get(lessonNumber);
      if (availableLessons.has(lessonNumber) && title) {
        return {
          lessonNumber,
          href: `/learning/plans/${lessonNumber}`,
          title,
        };
      }
      if (availableLessons.has(lessonNumber)) {
        return { lessonNumber, href: `/learning/plans/${lessonNumber}` };
      }
      return { lessonNumber };
    },
  );

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <Link href="/learning" className={styles.backLink}>
          ← Назад
        </Link>

        <div className={styles.header}>
          <p className={styles.eyebrow}>План 인하대학교 · Учебники</p>
          <h1 className={`${styles.title} kr`}>
            {textbook?.title ?? "새인하한국어1"} · 급 {textbook?.level ?? 1}
          </h1>
        </div>

        <LessonList items={lessonItems} />
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
