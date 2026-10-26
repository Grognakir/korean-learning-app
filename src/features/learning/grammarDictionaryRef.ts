import refs from "./grammarDictionaryRefs.json";

const REFS = refs as Record<string, string>;

/** external_id статьи словаря для блока грамматики урока (null — статьи нет). */
export function grammarDictionaryRef(
  textbookSlug: string | undefined,
  lessonNumber: number | undefined,
  blockId: string | undefined,
): string | null {
  if (!textbookSlug || lessonNumber == null || !blockId) return null;
  return REFS[`${textbookSlug}/${lessonNumber}/${blockId}`] ?? null;
}
