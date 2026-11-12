import { notFound } from "next/navigation";
import { displayName, getProfileRow, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import { fetchLessonPages } from "@/features/learning/fetchLessonPages";
import { isKnownLesson } from "@/features/learning/lessonRegistry";
import { findLessonToc } from "@/features/learning/lessonNav";
import { ProgramBreadcrumbs } from "../../ProgramBreadcrumbs";
import type { Block, TextbookPageRow } from "@/features/learning/types";
import styles from "./lesson.module.css";

function buildBlockTypeById(
  pages: TextbookPageRow[],
): Record<string, Block["type"]> {
  const map: Record<string, Block["type"]> = {};
  for (const page of pages) {
    for (const block of page.content.blocks) {
      if (block.type !== "lesson_toc" && block.id) {
        map[block.id] = block.type;
      }
    }
  }
  return map;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ textbookSlug: string; lessonNumber: string }>;
}) {
  const { textbookSlug, lessonNumber: lessonNumberParam } = await params;
  const lessonNumber = Number(lessonNumberParam);

  // Number("abc") — NaN: без проверки страница рендерила «Урок NaN».
  if (!isKnownLesson(textbookSlug, lessonNumber)) {
    notFound();
  }

  const { supabase, user } = await requireUser();

  const [profile, pages, { data: lesson }] = await Promise.all([
    getProfileRow(user.id),
    fetchLessonPages(supabase, textbookSlug, lessonNumber),
    supabase
      .from("lessons")
      .select("title, textbooks!inner(slug)")
      .eq("textbooks.slug", textbookSlug)
      .eq("lesson_number", lessonNumber)
      .maybeSingle(),
  ]);

  const username = displayName(profile, user);
  const lessonTitle = lesson?.title ?? null;

  if (pages.length === 0) {
    return (
      <div className={styles.pageShell}>
        <AppHeader username={username} />
        <main className={styles.wrap}>
          <ProgramBreadcrumbs
            items={[
              { href: "/learning/programs", label: "К учебникам" },
              { href: `/learning/programs/${textbookSlug}`, label: "К урокам" },
            ]}
          />
          <p className={styles.emptyState}>Урок {lessonNumber} скоро появится.</p>
        </main>
        <BottomTabBar />
      </div>
    );
  }

  const toc = findLessonToc(pages);
  const blockTypeById = buildBlockTypeById(pages);

  return (
    <div className={styles.pageShell}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <ProgramBreadcrumbs
          items={[
            { href: "/learning/programs", label: "К учебникам" },
            { href: `/learning/programs/${textbookSlug}`, label: "К урокам" },
          ]}
        />

        <h1 className={styles.title}>
          {lessonTitle ? (
            <>
              <span className="kr">
                {lessonNumber}과 · {lessonTitle}
              </span>
              {" - "}
              Состав урока
            </>
          ) : (
            <>Урок {lessonNumber} - Состав урока</>
          )}
        </h1>

        {toc && (
          <div className={styles.blocks}>
            <PageBlocks
              blocks={[toc]}
              textbookSlug={textbookSlug}
              lessonNumber={lessonNumber}
              blockTypeById={blockTypeById}
            />
          </div>
        )}
      </main>

      <BottomTabBar />
    </div>
  );
}
