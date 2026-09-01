import Link from "next/link";
import { notFound } from "next/navigation";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
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
  params: Promise<{ lessonNumber: string }>;
}) {
  const { lessonNumber: lessonNumberParam } = await params;
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
        .eq("textbooks.slug", "inha-1")
        .eq("lesson_number", lessonNumber)
        .order("page_index"),
      supabase
        .from("lessons")
        .select("title, textbooks!inner(slug)")
        .eq("textbooks.slug", "inha-1")
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
          <Link href="/learning/plans" className={styles.backLink}>
            ← К списку уроков
          </Link>
          <p className={styles.emptyState}>Урок {lessonNumber} скоро появится.</p>
        </main>
        <BottomTabBar sections={NAV_SECTIONS} />
      </div>
    );
  }

  const toc = findLessonToc(pages);
  const blockTypeById = buildBlockTypeById(pages);

  return (
    <div className={styles.pageShell}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <Link href="/learning/plans" className={styles.backLink}>
          ← К списку уроков
        </Link>

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
              lessonNumber={lessonNumber}
              blockTypeById={blockTypeById}
            />
          </div>
        )}
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
