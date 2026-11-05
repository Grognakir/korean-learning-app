import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { z } from "zod";

export const pageSchema = z.object({
  page_number: z.number().int().positive().nullable(),
  page_role: z.string().min(1),
  source_photo: z.string().min(1),
  blocks: z.array(z.object({ type: z.string().min(1) }).passthrough()),
}).passthrough();
export const lessonSchema = z.object({
  textbook_id: z.enum(["inha_book_1", "inha_book_2"]),
  lesson_number: z.number().int().positive(),
  title: z.string().min(1),
  pages: z.array(pageSchema).min(1),
}).passthrough();
export type LessonSource = z.infer<typeof lessonSchema>;
export const LESSON_SECTIONS = [
  { section: "준비하기 1", file: "01-preparation-1.json" },
  { section: "준비하기 2", file: "02-preparation-2.json" },
  { section: "말하기", file: "03-speaking.json" },
  { section: "듣고 말하기", file: "04-listening.json" },
  { section: "읽고 말하기", file: "05-reading.json" },
  { section: "쓰기", file: "06-writing.json" },
  { section: "문화 이해하기", file: "07-culture.json" },
] as const;
const manifestSchema = lessonSchema.extend({
  format: z.literal("lesson-sections-v1"),
  section_files: z.array(z.object({ section: z.string().min(1), file: z.string().min(1) })).min(1),
});
const sectionSchema = z.object({
  format: z.literal("lesson-section-v1"),
  lesson_file: z.string().min(1),
  section: z.string().min(1),
  pages: z.array(pageSchema).min(1),
}).strict();

function localFile(parent: string, file: string) {
  const base = dirname(parent);
  const target = resolve(base, file);
  const child = relative(realpathSync(base), realpathSync(target));
  if (isAbsolute(file) || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) throw new Error(`Файл раздела должен находиться внутри папки урока: ${file}`);
  return target;
}
const json = (file: string) => JSON.parse(readFileSync(file, "utf8"));

export function readLessonSource(filePath: string): LessonSource {
  let file = resolve(filePath);
  let raw = json(file);
  if (raw?.format === "lesson-section-v1") {
    const section = sectionSchema.parse(raw);
    const parent = localFile(file, section.lesson_file);
    const manifest = manifestSchema.parse(json(parent));
    if (!manifest.section_files.some((entry) => entry.section === section.section && realpathSync(localFile(parent, entry.file)) === realpathSync(file))) throw new Error(`Раздел не подключён к уроку: ${basename(file)}`);
    file = parent; raw = manifest;
  }
  if (!raw?.format) return lessonSchema.parse(raw);
  const manifest = manifestSchema.parse(raw);
  const toc = manifest.pages.flatMap((page) => page.blocks).find((block) => block.type === "lesson_toc");
  const sections = z.array(z.object({ key: z.string() }).passthrough()).parse(toc?.sections).map((section) => section.key);
  if (new Set(sections).size !== sections.length || sections.join("\0") !== manifest.section_files.map((part) => part.section).join("\0")) throw new Error(`Порядок разделов не совпадает с оглавлением: ${basename(file)}`);
  const paths = manifest.section_files.map((part) => localFile(file, part.file));
  if (new Set(paths.map((path) => realpathSync(path))).size !== paths.length) throw new Error("Один файл раздела подключён несколько раз.");
  const pages = [...manifest.pages];
  for (const [index, path] of paths.entries()) {
    const part = sectionSchema.parse(json(path));
    const expected = manifest.section_files[index].section;
    if (part.section !== expected || realpathSync(localFile(path, part.lesson_file)) !== realpathSync(file)) throw new Error(`Неверная принадлежность раздела: ${basename(path)}`);
    if (part.pages.some((page) => page.blocks.some((block) => block.type === "lesson_toc" || block.toc_section !== expected))) throw new Error(`Блоки раздела ${expected} имеют другой toc_section.`);
    pages.push(...part.pages);
  }
  const numbered = pages.flatMap((page) => page.page_number === null ? [] : [page.page_number]);
  if (new Set(numbered).size !== numbered.length || numbered.some((number, index) => index > 0 && number <= numbered[index - 1])) throw new Error("Порядок или номера страниц урока нарушены.");
  const { format, section_files, ...lesson } = manifest;
  void format; void section_files;
  return { ...lesson, pages };
}

export function lessonSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? lessonSourceFiles(path) : /^lesson-\d+\.json$/.test(entry.name) ? [path] : [];
  }).sort();
}

export function splitLessonSource(source: LessonSource, lessonFile: string) {
  const lesson = lessonSchema.parse(source);
  if (lesson.format) throw new Error("Урок уже разделён на файлы.");
  const toc = lesson.pages.flatMap((page) => page.blocks).find((block) => block.type === "lesson_toc");
  const keys = z.array(z.object({ key: z.string() }).passthrough()).parse(toc?.sections).map((section) => section.key);
  if (keys.join("\0") !== LESSON_SECTIONS.map((section) => section.section).join("\0")) throw new Error("Оглавление урока отличается от семи ожидаемых разделов.");
  const parts = LESSON_SECTIONS.map(({ section, file }) => ({ file, content: { format: "lesson-section-v1" as const, lesson_file: lessonFile, section, pages: [] as LessonSource["pages"] } }));
  const opening: LessonSource["pages"] = [];
  let active: string | undefined;
  for (const page of lesson.pages) {
    const sections = [...new Set(page.blocks.flatMap((block) => typeof block.toc_section === "string" ? [block.toc_section] : []))];
    if (sections.length > 1) throw new Error(`На странице ${page.page_number} смешаны разделы.`);
    if (sections.length) active = sections[0];
    if (page.blocks.some((block) => block.type === "lesson_toc")) {
      if (active) throw new Error("Оглавление находится среди страниц раздела.");
      opening.push(page);
    } else {
      const part = parts.find((part) => part.content.section === active);
      if (!part) throw new Error(`Не найден раздел для страницы ${page.page_number}.`);
      part.content.pages.push(page);
    }
  }
  if (parts.some((part) => !part.content.pages.length)) throw new Error("Урок содержит раздел без страниц.");
  const assembled = [...opening, ...parts.flatMap((part) => part.content.pages)];
  if (assembled.some((page, index) => page !== lesson.pages[index])) throw new Error("Разделение изменяет порядок страниц.");
  const { pages, ...metadata } = lesson;
  void pages;
  return { manifest: { format: "lesson-sections-v1" as const, ...metadata, pages: opening, section_files: [...LESSON_SECTIONS] }, parts };
}
