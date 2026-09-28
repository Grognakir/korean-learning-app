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
  vocab?: { ko: string; translation_ru: string }[];
};

const lessonDir = join(
  process.cwd(),
  "content/reference/inha_book_content/2급_lesson_04",
);
const lesson = JSON.parse(
  readFileSync(join(lessonDir, "lesson-04.json"), "utf8"),
) as { pages: { blocks: LessonBlock[] }[] };
const blocks = lesson.pages.flatMap((page) => page.blocks);

const expected = new Map([
  ["text-weather-forecast-dialogue", "lesson_4/illustration_1_dusty_weather.png"],
  ["text-forecast-broadcast", "lesson_4/illustration_2_weather_forecast.png"],
  ["listening-weather-experience", "lesson_4/illustration_3_typhoon_wind.png"],
  ["text-reading-korea-weather", "lesson_4/illustration_4_four_seasons.png"],
  ["text-culture-rainy-food", "lesson_4/illustration_5_rainy_day_food.png"],
]);

it("подключает пять иллюстраций к нужным разделам четвёртого урока", () => {
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

it("показывает перевод 되 в тексте прогноза погоды", () => {
  const block = blocks.find((item) => item.id === "text-forecast-broadcast");

  expect(block?.vocab).toContainEqual({
    ko: "되",
    translation_ru: "составит, станет (форма от 되다)",
  });
});
