import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import styles from "./learning.module.css";

// docs/dev_docs/3-dictionary-and-learning.md: учебник — 16 уроков; сейчас
// импортирован только урок 1 (docs/reference/inha_book_1_content), 2-16
// появятся тем же импорт-скриптом по мере авторства контента.
const TOTAL_LESSONS = 16;

export default async function LearningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: textbook }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase
      .from("textbooks")
      .select("id, title, level, textbook_pages(lesson_number)")
      .eq("slug", "inha-1")
      .single(),
  ]);

  const username = profile?.username ?? user.email ?? "Пользователь";

  const { data: lessons } = textbook?.id
    ? await supabase
        .from("lessons")
        .select("lesson_number, title")
        .eq("textbook_id", textbook.id)
    : { data: null };

  const availableLessons = new Set(
    (textbook?.textbook_pages ?? []).map((page) => page.lesson_number),
  );

  const lessonTitles = new Map(
    (lessons ?? []).map((lesson) => [lesson.lesson_number, lesson.title]),
  );

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <Link href="/" className={styles.backLink}>
          ← Назад
        </Link>

        <div className={styles.header}>
          <p className={styles.eyebrow}>План 인하대학교 · Учебники</p>
          <h1 className={`${styles.title} kr`}>
            {textbook?.title ?? "새인하한국어1"} · 급 {textbook?.level ?? 1}
          </h1>
        </div>

        <ul className={styles.lessonList}>
          {Array.from({ length: TOTAL_LESSONS }, (_, i) => i + 1).map(
            (lessonNumber) => {
              const title = lessonTitles.get(lessonNumber);
              if (availableLessons.has(lessonNumber) && title) {
                return (
                  <li key={lessonNumber} className={styles.lessonItemWide}>
                    <Link
                      href={`/learning/${lessonNumber}`}
                      className={`${styles.lessonLink} ${styles.lessonLinkWide} kr`}
                    >
                      {lessonNumber}과 · {title}
                    </Link>
                  </li>
                );
              }
              if (availableLessons.has(lessonNumber)) {
                return (
                  <li key={lessonNumber}>
                    <Link
                      href={`/learning/${lessonNumber}`}
                      className={styles.lessonLink}
                    >
                      Урок {lessonNumber}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={lessonNumber}>
                  <span className={styles.lessonStub} title="Скоро">
                    Урок {lessonNumber}
                  </span>
                </li>
              );
            },
          )}
        </ul>
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
