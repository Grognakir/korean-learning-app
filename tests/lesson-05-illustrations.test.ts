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
  "content/reference/inha_book_content/2급_lesson_05",
);
const lesson = JSON.parse(
  readFileSync(join(lessonDir, "lesson-05.json"), "utf8"),
) as { pages: { blocks: LessonBlock[] }[] };
const blocks = lesson.pages.flatMap((page) => page.blocks);

const expected = new Map([
  ["text-party-planning-dialogue", "lesson_5/illustration_1_surprise_birthday.png"],
  ["text-visit-etiquette-dialogue", "lesson_5/illustration_2_visit_etiquette.png"],
  ["listening-housewarming-invite", "lesson_5/illustration_3_housewarming_gifts.png"],
  ["text-reading-invitation", "lesson_5/illustration_4_alumni_invitation.png"],
  ["text-culture-korean-invitations", "lesson_5/illustration_5_korean_celebrations.png"],
]);

it("подключает пять иллюстраций к нужным разделам пятого урока", () => {
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
