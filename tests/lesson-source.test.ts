// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { LESSON_SECTIONS, lessonSourceFiles, readLessonSource, splitLessonSource, type LessonSource } from "../scripts/lib/lesson-source";

let directory: string, file: string;
const fixture = (): LessonSource => ({
  textbook_id: "inha_book_2", lesson_number: 12, title: "다툼과 화해",
  pages: [
    { page_number: null, page_role: "lesson_opening", source_photo: "opening", blocks: [{ type: "lesson_toc", sections: LESSON_SECTIONS.map(({ section }) => ({ key: section, items: [] })) }] },
    ...LESSON_SECTIONS.map(({ section }, index) => ({ page_number: 192 + index, page_role: "content", source_photo: `photo-${index}`, blocks: [{ type: "text", id: `text-${index}`, toc_section: section, lines: [{ ko: "내용", ru: "Содержание" }], arbitrary: { preserve: ["value"] } }] })),
  ],
});
function saveSplit(lesson = fixture()) {
  const split = splitLessonSource(lesson, basename(file));
  writeFileSync(file, JSON.stringify(split.manifest));
  split.parts.forEach((part) => writeFileSync(join(directory, part.file), JSON.stringify(part.content)));
  return split;
}
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "lesson-sections-")); file = join(directory, "lesson-12.json"); });
afterEach(() => rmSync(directory, { recursive: true, force: true }));

it("обратно совместим с цельным уроком", () => {
  const lesson = fixture(); writeFileSync(file, JSON.stringify(lesson));
  expect(readLessonSource(file)).toEqual(lesson);
});
it("семь разделов собираются без потери метаданных, страниц и вложенного содержания", () => {
  const lesson = fixture(); const split = saveSplit(lesson);
  expect(split.parts).toHaveLength(7);
  expect(split.manifest.pages).toHaveLength(1);
  expect(readLessonSource(file)).toEqual(lesson);
  expect(readLessonSource(join(directory, "05-reading.json"))).toEqual(lesson);
  expect(lessonSourceFiles(directory)).toEqual([file]);
});
it("сохраняет пустую страницу в текущем разделе и не сдвигает порядок", () => {
  const lesson = fixture();
  lesson.pages.splice(2, 0, { page_number: 192.5, page_role: "content", source_photo: "empty", blocks: [] });
  lesson.pages.forEach((page, index) => { if (page.page_number !== null) page.page_number = 190 + index; });
  const split = saveSplit(lesson);
  expect(split.parts[0].content.pages).toHaveLength(2);
  expect(readLessonSource(file)).toEqual(lesson);
});
it("правка одного файла раздела попадает в собранный урок", () => {
  const split = saveSplit();
  split.parts[4].content.pages[0].blocks[0].title = "Новая редакция";
  writeFileSync(join(directory, split.parts[4].file), JSON.stringify(split.parts[4].content));
  expect(readLessonSource(file).pages[5].blocks[0].title).toBe("Новая редакция");
});
it("отклоняет перепутанные порядок, принадлежность и содержимое разделов", () => {
  const split = saveSplit();
  writeFileSync(file, JSON.stringify({ ...split.manifest, section_files: [...split.manifest.section_files].reverse() }));
  expect(() => readLessonSource(file)).toThrow("Порядок разделов");
  writeFileSync(file, JSON.stringify(split.manifest));
  const part = split.parts[0];
  writeFileSync(join(directory, part.file), JSON.stringify({ ...part.content, section: "Другое" }));
  expect(() => readLessonSource(file)).toThrow("принадлежность");
  part.content.pages[0].blocks[0].toc_section = "쓰기";
  writeFileSync(join(directory, part.file), JSON.stringify(part.content));
  expect(() => readLessonSource(file)).toThrow("toc_section");
});
it("отклоняет повторные/отсутствующие файлы и выход за папку урока", () => {
  const split = saveSplit();
  const entries: { section: string; file: string }[] = split.manifest.section_files.map((part) => ({ ...part }));
  entries[1].file = entries[0].file;
  writeFileSync(file, JSON.stringify({ ...split.manifest, section_files: entries }));
  expect(() => readLessonSource(file)).toThrow("несколько раз");
  entries[1].file = "missing.json";
  writeFileSync(file, JSON.stringify({ ...split.manifest, section_files: entries }));
  expect(() => readLessonSource(file)).toThrow();
  entries[1].file = `../${basename(directory)}/${split.parts[1].file}`;
  writeFileSync(file, JSON.stringify({ ...split.manifest, section_files: entries }));
  expect(readLessonSource(file)).toEqual(fixture());
  entries[1].file = file;
  writeFileSync(file, JSON.stringify({ ...split.manifest, section_files: entries }));
  expect(() => readLessonSource(file)).toThrow("внутри папки");
});
it("не принимает отдельный раздел, не включённый в manifest", () => {
  const split = saveSplit();
  const orphan = join(directory, "orphan.json"); writeFileSync(orphan, JSON.stringify(split.parts[0].content));
  expect(() => readLessonSource(orphan)).toThrow("не подключён");
});
it("не меняет страницы с перемешанными разделами или нарушенной последовательностью", () => {
  const lesson = fixture();
  lesson.pages[1].blocks.push({ type: "text", toc_section: "쓰기" });
  expect(() => splitLessonSource(lesson, basename(file))).toThrow("смешаны");
  const other = fixture(); [other.pages[1], other.pages[2]] = [other.pages[2], other.pages[1]];
  expect(() => splitLessonSource(other, basename(file))).toThrow("порядок страниц");
});
it("все реальные уроки имеют оглавление и читаются полностью", () => {
  const files = lessonSourceFiles(join(process.cwd(), "content/reference/inha_book_content"));
  expect(files).toHaveLength(32);
  let pages = 0;
  for (const file of files) {
    const lesson = readLessonSource(file); pages += lesson.pages.length;
    const raw = JSON.parse(readFileSync(file, "utf8"));
    if (raw.format) expect(raw.section_files.map((part: { section: string }) => part.section)).toEqual(LESSON_SECTIONS.map((section) => section.section));
    else expect(splitLessonSource(lesson, basename(file)).parts).toHaveLength(7);
    expect(dirname(file)).toContain("lesson_");
  }
  expect(pages).toBe(485);
});
