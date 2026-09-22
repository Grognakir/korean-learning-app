// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

type LessonBlock = {
  id?: string;
  type: string;
  related_text_ref?: string;
  items?: { ko: string; translation_ru: string }[];
};

const lesson = JSON.parse(
  readFileSync(
    join(process.cwd(), "content/reference/inha_book_content/2급_lesson_03/lesson-03.json"),
    "utf8",
  ),
) as { pages: { blocks: LessonBlock[] }[] };

it("содержит переводы слов из диалога второй подготовки", () => {
  const blocks = lesson.pages.flatMap((page) => page.blocks);
  const vocab = blocks.find((block) => block.id === "vocab-junbihagi2");
  const translations = new Map(vocab?.items?.map((item) => [item.ko, item.translation_ru]));

  expect(vocab?.related_text_ref).toBe("text-junbihagi2-dialogue");
  expect([...translations.keys()]).toEqual(
    expect.arrayContaining([
      "고민",
      "걱정",
      "전공하다",
      "사회",
      "생기다",
      "말씀",
      "사회학",
      "경영학",
      "문화",
      "관심",
      "생각",
    ]),
  );
  for (const translation of translations.values()) {
    expect(translation.trim()).not.toBe("");
  }
});
