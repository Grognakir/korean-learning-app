import Link from "next/link";
import { notFound } from "next/navigation";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import { resolveBlockAssets } from "@/features/learning/resolveBlockAssets";
import type { Block, TextbookPageRow } from "@/features/learning/types";
import styles from "../lesson.module.css";

export default async function LessonSectionPage({
  params,
}: {
  params: Promise<{ lessonNumber: string; sectionKey: string }>;
}) {
  const { lessonNumber: lessonNumberParam, sectionKey: sectionKeyParam } =
    await params;
  const lessonNumber = Number(lessonNumberParam);

  // Number("abc") — NaN: без проверки страница рендерила «Урок NaN».
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1) {
    notFound();
  }
  const sectionKey = decodeURIComponent(sectionKeyParam);

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

  const sectionBlocks: Block[] = [];
  for (const page of pages) {
    for (const block of page.content.blocks) {
      if (block.type !== "lesson_toc" && block.toc_section === sectionKey) {
        sectionBlocks.push(block);
      }
    }
  }

  const vocabBlocks = sectionBlocks.filter((block) => block.type === "vocab_list");
  const otherBlocks = sectionBlocks.filter((block) => block.type !== "vocab_list");
  const orderedBlocks = [...vocabBlocks, ...otherBlocks];

  const heading = (
    <h1 className={styles.title}>
      {lessonTitle ? (
        <>
          <span className="kr">
            {lessonNumber}과 · {lessonTitle}
          </span>
          {" - "}
          <span className="kr">{sectionKey}</span>
        </>
      ) : (
        <>
          Урок {lessonNumber} - <span className="kr">{sectionKey}</span>
        </>
      )}
    </h1>
  );

  if (sectionBlocks.length === 0) {
    return (
      <div className={styles.pageShell}>
        <AppHeader username={username} />
        <main className={styles.wrap}>
          <Link href={`/learning/plans/${lessonNumber}`} className={styles.backLink}>
            ← К оглавлению урока
          </Link>
          {heading}
          <p className={styles.emptyState}>
            Материалы раздела скоро появятся.
          </p>
        </main>
        <BottomTabBar sections={NAV_SECTIONS} />
      </div>
    );
  }

  const blocks = await resolveBlockAssets(orderedBlocks);

  return (
    <div className={styles.pageShell}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <Link href={`/learning/plans/${lessonNumber}`} className={styles.backLink}>
          ← К оглавлению урока
        </Link>

        {heading}

        <div className={styles.blocks}>
          <PageBlocks blocks={blocks} />
        </div>
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
