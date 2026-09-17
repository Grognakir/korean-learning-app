import type { LessonTocBlock, TextbookPageRow } from "@/features/learning/types";

export type LessonNavSection = {
  key: string;
  label: string;
  available: boolean;
  href: string;
};

export type LessonNav = {
  sections: LessonNavSection[];
  currentIndex: number;
  next: LessonNavSection | null;
};

function findLessonToc(pages: TextbookPageRow[]): LessonTocBlock | null {
  for (const page of pages) {
    for (const block of page.content.blocks) {
      if (block.type === "lesson_toc") return block;
    }
  }
  return null;
}

export function buildLessonNav(
  pages: TextbookPageRow[],
  textbookSlug: string,
  lessonNumber: number,
  currentSectionKey: string,
): LessonNav {
  const toc = findLessonToc(pages);
  const sections: LessonNavSection[] = (toc?.sections ?? []).map((section) => ({
    key: section.key,
    label: section.items[0]?.label ?? section.key,
    available: section.items.some((item) => item.block_ref != null),
    href: `/learning/plans/${textbookSlug}/${lessonNumber}/${encodeURIComponent(section.key)}`,
  }));

  const currentIndex = sections.findIndex((section) => section.key === currentSectionKey);
  const next =
    sections
      .slice(currentIndex + 1)
      .find((section) => section.available) ?? null;

  return { sections, currentIndex, next };
}
