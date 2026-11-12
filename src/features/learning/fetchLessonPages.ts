import type { SupabaseClient } from "@supabase/supabase-js";
import type { TextbookPageRow } from "./types";

async function queryLessonPages(
  supabase: SupabaseClient,
  textbookSlug: string,
  lessonNumber: number,
) {
  return supabase
    .from("textbook_pages")
    .select(
      "id, page_index, page_number, lesson_number, content, textbooks!inner(slug)",
    )
    .eq("textbooks.slug", textbookSlug)
    .eq("lesson_number", lessonNumber)
    .order("page_index");
}

/**
 * Страницы урока. Сбой запроса не должен выглядеть как «материалы скоро
 * появятся»: ошибку пробрасываем (покажется окно ошибки с «Повторить»),
 * а пустой ответ перепроверяем один раз — случайный пустой ответ иначе
 * кэшируется роутером вместе со страницей-заглушкой.
 */
export async function fetchLessonPages(
  supabase: SupabaseClient,
  textbookSlug: string,
  lessonNumber: number,
): Promise<TextbookPageRow[]> {
  let result = await queryLessonPages(supabase, textbookSlug, lessonNumber);
  if (!result.error && (result.data?.length ?? 0) === 0) {
    result = await queryLessonPages(supabase, textbookSlug, lessonNumber);
  }
  if (result.error) {
    throw new Error(`textbook_pages: ${result.error.message}`);
  }
  return (result.data ?? []) as unknown as TextbookPageRow[];
}
