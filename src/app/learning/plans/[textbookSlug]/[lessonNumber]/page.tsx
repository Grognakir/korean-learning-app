import { notFound } from "next/navigation";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import { PlanBreadcrumbs } from "../../PlanBreadcrumbs";
import type { Block, LessonTocBlock, TextbookPageRow } from "@/features/learning/types";
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

function findLessonToc(pages: TextbookPageRow[]): LessonTocBlock | null {
  for (const page of pages) {
    for (const block of page.content.blocks) {
      if (block.type === "lesson_toc") return block;
    }
  }
  return null;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ textbookSlug: string; lessonNumber: string }>;
}) {
  const { textbookSlug, lessonNumber: lessonNumberParam } = await params;
  const lessonNumber = Number(lessonNumberParam);

  // Number("abc") — NaN: без проверки страница рендерила «Урок NaN».
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1) {
    notFound();
  }

  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: rawPages }, { data: lesson }] =
    await Promise.all([
      supabase.from("profiles").select("username").eq("id", user.id).single(),
      supabase
        .from("textbook_pages")
        .select(
          "id, page_index, page_number, lesson_number, content, textbooks!inner(slug)",
        )
        .eq("textbooks.slug", textbookSlug)
        .eq("lesson_number", lessonNumber)
        .order("page_index"),
      supabase
        .from("lessons")
        .select("title, textbooks!inner(slug)")
        .eq("textbooks.slug", textbookSlug)
        .eq("lesson_number", lessonNumber)
        .maybeSingle(),
    ]);

  const username = displayName(profile, user);
  const pages = (rawPages ?? []) as TextbookPageRow[];
  const lessonTitle = lesson?.title ?? null;

  if (pages.length === 0) {
    return (
      <div className={styles.pageShell}>
        <AppHeader username={username} />
        <main className={styles.wrap}>
          <PlanBreadcrumbs
            items={[
              { href: "/learning/plans", label: "К учебникам" },
              { href: `/learning/plans/${textbookSlug}`, label: "К урокам" },
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
        <PlanBreadcrumbs
          items={[
            { href: "/learning/plans", label: "К учебникам" },
            { href: `/learning/plans/${textbookSlug}`, label: "К урокам" },
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
