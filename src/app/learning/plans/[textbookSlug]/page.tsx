import { notFound } from "next/navigation";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { LessonList, type LessonListItem } from "../LessonList";
import { PlanBreadcrumbs } from "../PlanBreadcrumbs";
import { TOTAL_LESSONS } from "../constants";
import styles from "../learning.module.css";

export default async function TextbookPlanPage({
  params,
}: {
  params: Promise<{ textbookSlug: string }>;
}) {
  const { textbookSlug } = await params;
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
      .eq("slug", textbookSlug)
      .single(),
    fetchAllRows<{ lesson_number: number }>((from, to) =>
      supabase
        .from("textbook_pages")
        .select("lesson_number, textbooks!inner(slug)")
        .eq("textbooks.slug", textbookSlug)
        .range(from, to),
    ),
  ]);

  if (!textbook) notFound();

  const username = displayName(profile, user);

  const { data: lessons } = await supabase
    .from("lessons")
    .select("lesson_number, title")
    .eq("textbook_id", textbook.id);

  const availableLessons = new Set(pageRows.map((page) => page.lesson_number));

  const lessonTitles = new Map(
    (lessons ?? []).map((lesson) => [lesson.lesson_number, lesson.title]),
  );

  const lessonItems: LessonListItem[] = [];
  for (let lessonNumber = 1; lessonNumber <= TOTAL_LESSONS; lessonNumber++) {
    const title = lessonTitles.get(lessonNumber);
    if (availableLessons.has(lessonNumber) && title) {
      lessonItems.push({
        lessonNumber,
        href: `/learning/plans/${textbookSlug}/${lessonNumber}`,
        title,
      });
      continue;
    }
    if (availableLessons.has(lessonNumber)) {
      lessonItems.push({ lessonNumber, href: `/learning/plans/${textbookSlug}/${lessonNumber}` });
      continue;
    }
    // Недоступные уроки просто не показываем — плашка-заглушка на весь
    // ряд ("Остальные уроки — скоро") только отвлекала от реальных уроков.
    while (lessonNumber + 1 <= TOTAL_LESSONS && !availableLessons.has(lessonNumber + 1)) {
      lessonNumber++;
    }
  }

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <PlanBreadcrumbs items={[{ href: "/learning/plans", label: "К учебникам" }]} />

        <div className={styles.header}>
          <p className={styles.eyebrow}>План 인하대학교 · Учебники</p>
          <h1 className={`${styles.title} kr`}>
            {textbook.title} · 급 {textbook.level}
          </h1>
        </div>

        <LessonList items={lessonItems} />
      </main>

      <BottomTabBar />
    </div>
  );
}
