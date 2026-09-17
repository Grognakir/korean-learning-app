import Link from "next/link";
import { notFound } from "next/navigation";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import { buildLessonNav } from "@/features/learning/lessonNav";
import { resolveBlockAssets, textbookAssetPrefix } from "@/features/learning/resolveBlockAssets";
import type { Block, TextbookPageRow } from "@/features/learning/types";
import styles from "../lesson.module.css";
import { SectionNav } from "./SectionNav";

export default async function LessonSectionPage({
  params,
}: {
  params: Promise<{ textbookSlug: string; lessonNumber: string; sectionKey: string }>;
}) {
  const {
    textbookSlug,
    lessonNumber: lessonNumberParam,
    sectionKey: sectionKeyParam,
  } = await params;
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

  const nav = buildLessonNav(pages, textbookSlug, lessonNumber, sectionKey);

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
          <Link href={`/learning/plans/${textbookSlug}/${lessonNumber}`} className={styles.backLink}>
            ← К оглавлению урока
          </Link>
          {heading}
          <p className={styles.emptyState}>
            Материалы раздела скоро появятся.
          </p>
        </main>
        <BottomTabBar />
      </div>
    );
  }

  const blocks = await resolveBlockAssets(orderedBlocks, textbookAssetPrefix(textbookSlug));

  return (
    <div className={styles.pageShell}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <Link href={`/learning/plans/${textbookSlug}/${lessonNumber}`} className={styles.backLink}>
          ← К оглавлению урока
        </Link>

        {heading}

        <div className={styles.sectionLayout}>
          <SectionNav nav={nav} />

          <div className={styles.blocks}>
            <PageBlocks blocks={blocks} />
          </div>
        </div>

        <div className={styles.sectionFooterNav}>
          <Link href={`/learning/plans/${textbookSlug}/${lessonNumber}`} className={styles.backLink}>
            ← К оглавлению урока
          </Link>
          {nav.next && (
            <Link href={nav.next.href} className={styles.nextSectionLink}>
              Следующий раздел: <span className="kr">{nav.next.key}</span> →
            </Link>
          )}
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
