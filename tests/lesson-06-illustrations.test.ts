// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

type Illustration = {
  storage_path: string | null;
  original_kind: "photo" | "illustration";
};

type LessonBlock = {
  id?: string;
  illustration?: Illustration | null;
  warmup?: { illustration?: Illustration | null };
};

const lessonDir = join(
  process.cwd(),
  "content/reference/inha_book_content/2급_lesson_06",
);
const lesson = JSON.parse(
  readFileSync(join(lessonDir, "lesson-06.json"), "utf8"),
) as { pages: { blocks: LessonBlock[] }[] };
const blocks = lesson.pages.flatMap((page) => page.blocks);

const expected = new Map([
  ["text-recipe-dialogue", "lesson_6/illustration_1_bibimbap_recipe.png"],
  ["text-delivery-dialogue", "lesson_6/illustration_2_food_delivery.png"],
  ["listening-birthday-food", "lesson_6/illustration_3_birthday_food.png"],
  ["text-reading-samgyetang", "lesson_6/illustration_4_samgyetang.png"],
  ["text-culture-holiday-food", "lesson_6/illustration_5_holiday_food.png"],
]);

it("подключает пять иллюстраций к нужным разделам шестого урока", () => {
  for (const [id, storagePath] of expected) {
    const block = blocks.find((item) => item.id === id);
    const illustration = block?.illustration ?? block?.warmup?.illustration;

    expect(illustration).toEqual({
      storage_path: storagePath,
      original_kind: "illustration",
    });
    expect(existsSync(join(lessonDir, "img", storagePath.split("/").at(-1)!))).toBe(true);
  }
});

it("не добавляет отдельную иллюстрацию в раздел 말하기", () => {
  const block = blocks.find((item) => item.id === "text-speaking-summary");

  expect(block?.illustration).toBeNull();
});
