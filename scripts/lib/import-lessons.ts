import type { SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { applyLessonImport, prepareLessonImport, type LessonImportPlan } from "./import-lesson";
import { lessonSourceFiles } from "./lesson-source";

export async function importAllLocalLessons(client: SupabaseClient, url: string, directory: string, options: { dryRun?: boolean; backupDir?: string } = {}) {
  if (!options.dryRun && !options.backupDir) throw new Error("Для обновления всех уроков укажите --backup-dir <папка резервной копии>.");
  const files = lessonSourceFiles(directory);
  if (!files.length) throw new Error("Файлы уроков не найдены.");
  const plans: LessonImportPlan[] = [];
  for (const file of files) plans.push(await prepareLessonImport(client, url, file));
  const lessons = new Set(plans.map((plan) => `${plan.textbookId}:${plan.lesson.lesson_number}`));
  const ids = plans.flatMap((plan) => plan.rows.map((row) => row.id));
  if (lessons.size !== plans.length || new Set(ids).size !== ids.length) throw new Error("Уроки или идентификаторы страниц повторяются. Импорт остановлен.");
  const changed = plans.reduce((total, plan) => total + plan.rows.filter((row, index) => {
    const { id, page_index, page_number, content } = row;
    return !isDeepStrictEqual(plan.existing[index], { id, page_index, page_number, content });
  }).length, 0);
  console.log(`Проверено: ${plans.length} урока, ${ids.length} страниц. Отличаются от локальной базы: ${changed} страниц.`);
  if (options.dryRun) { console.log("Изменения в базу не записывались."); return { lessons: plans.length, pages: ids.length, changed }; }

  const { data: lessonRows, error } = await client.from("lessons").select("*").in("textbook_id", [...new Set(plans.map((plan) => plan.textbookId))]);
  if (error) throw error;
  const backupDir = resolve(options.backupDir!);
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(backupDir, `lessons-before-import-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(backupPath, JSON.stringify({
    savedAt: new Date().toISOString(), endpoint: new URL(url).origin,
    lessons: lessonRows,
    pages: plans.flatMap((plan) => plan.existing.map((page) => ({ ...page, textbook_id: plan.textbookId, lesson_number: plan.lesson.lesson_number }))),
  }, null, 2) + "\n", { flag: "wx" });
  console.log(`Резервная копия: ${backupPath}`);
  for (const plan of plans) {
    await applyLessonImport(client, plan);
    console.log(`${plan.slug}, урок ${plan.lesson.lesson_number}: ${plan.rows.length} страниц обновлено и проверено.`);
  }
  return { lessons: plans.length, pages: ids.length, changed, backupPath };
}
