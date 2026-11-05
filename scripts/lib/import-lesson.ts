import type { SupabaseClient } from "@supabase/supabase-js";
import { isDeepStrictEqual } from "node:util";
import { readLessonSource } from "./lesson-source";

const textbookSlugs = { inha_book_1: "inha-1", inha_book_2: "inha-2" };

export async function prepareLessonImport(
  supabase: SupabaseClient,
  supabaseUrl: string,
  filePath: string,
) {
  const endpoint = new URL(supabaseUrl);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)) {
    throw new Error("Импорт JSON урока разрешён только в локальную базу. Проверьте NEXT_PUBLIC_SUPABASE_URL в .env.local.");
  }

  const lesson = readLessonSource(filePath);
  const slug = textbookSlugs[lesson.textbook_id];
  const { data: textbook, error: textbookError } = await supabase
    .from("textbooks")
    .select("id")
    .eq("slug", slug)
    .single();
  if (textbookError) throw textbookError;

  const selectPages = () => supabase
    .from("textbook_pages")
    .select("id, page_index, page_number, content")
    .eq("textbook_id", textbook.id)
    .eq("lesson_number", lesson.lesson_number)
    .order("page_index");

  const { data: existing, error: pagesError } = await selectPages();
  if (pagesError) throw pagesError;
  if (!existing.length) {
    throw new Error(`Урок ${lesson.lesson_number} (${slug}) ещё не импортирован. Для первого импорта используйте полный импорт учебника.`);
  }
  if (existing.length !== lesson.pages.length) {
    throw new Error(`Число страниц изменилось: в базе ${existing.length}, в JSON ${lesson.pages.length}. Нужен полный импорт учебника для пересчёта page_index.`);
  }

  const rows = lesson.pages.map((page, index) => ({
    id: existing[index].id,
    textbook_id: textbook.id,
    lesson_number: lesson.lesson_number,
    page_index: existing[index].page_index,
    page_number: page.page_number,
    content: {
      page_role: page.page_role,
      source_photo: page.source_photo,
      blocks: page.blocks,
    },
  }));

  return { endpoint: endpoint.origin, slug, lesson, rows, existing, textbookId: textbook.id, selectPages };
}
export type LessonImportPlan = Awaited<ReturnType<typeof prepareLessonImport>>;

export async function applyLessonImport(supabase: SupabaseClient, plan: LessonImportPlan) {
  const { rows, lesson, textbookId, selectPages } = plan;
  const { error: updateError } = await supabase
    .from("textbook_pages")
    .upsert(rows, { onConflict: "textbook_id,page_index" });
  if (updateError) throw updateError;

  const { error: lessonError } = await supabase.from("lessons").upsert({
    textbook_id: textbookId,
    lesson_number: lesson.lesson_number,
    title: lesson.title,
  }, { onConflict: "textbook_id,lesson_number" });
  if (lessonError) throw lessonError;

  const { data: saved, error: verifyError } = await selectPages();
  if (verifyError) throw verifyError;
  const expected = rows.map(({ id, page_index, page_number, content }) => ({ id, page_index, page_number, content }));
  if (!isDeepStrictEqual(saved, expected)) throw new Error("Данные после импорта не совпали с JSON. Повторите импорт после проверки базы.");
}

export async function importLessonJson(supabase: SupabaseClient, supabaseUrl: string, filePath: string, dryRun = false) {
  const plan = await prepareLessonImport(supabase, supabaseUrl, filePath);
  const { lesson, rows, endpoint, slug } = plan;

  console.log(`Локальная база: ${endpoint}`);
  console.log(`${slug}, урок ${lesson.lesson_number} «${lesson.title}»: ${rows.length} страниц.`);
  if (dryRun) {
    console.log("Проверка завершена. Изменения в базу не записывались.");
    return;
  }

  await applyLessonImport(supabase, plan);
  console.log(`Готово: ${rows.length} страниц обновлено и проверено.`);
}
