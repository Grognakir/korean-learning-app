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
  items?: { answers: string[] }[];
  template?: string[];
  warmup?: { illustration?: Illustration | null };
  rules?: string[];
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

it("показывает перевод 이제 в примере грамматики AV-기 시작하다", () => {
  const block = blocks.find((item) => item.id === "grammar-4");

  expect(block?.vocab).toContainEqual({
    ko: "이제",
    translation_ru: "теперь, уже",
  });
});

it("разделяет русское слово и 받침 в правилах N(으)로③", () => {
  const block = blocks.find((item) => item.id === "grammar-5");

  expect(block?.rules).toEqual(["нет 받침 — N로", "есть 받침 — N으로"]);
});

it("оставляет неизменяемые слова снаружи, а частицы и грамматику включает в поля", () => {
  const exercise3a = blocks.find((item) => item.id === "exercise-3a");
  const exercise3b = blocks.find((item) => item.id === "exercise-3b");
  const exercise3c = blocks.find((item) => item.id === "exercise-3c");

  expect(exercise3a?.template).toEqual(["가: {0} {1}보다 {2}."]);
  expect(exercise3a?.items?.[0].answers).toEqual(["자동차가", "작년", "많아졌어요"]);

  expect(exercise3b?.template).toEqual(["가: {0} 어때요?", "나: {1} 점점 {2}."]);
  expect(exercise3b?.items?.[1].answers).toEqual([
    "하늘에 구름이",
    "하늘에 구름이",
    "많아지고 있어요",
  ]);

  expect(exercise3c?.template).toEqual(["가: {0} 걱정이에요.", "나: {1} {2}."]);
  expect(exercise3c?.items?.[2].answers).toEqual([
    "한국어가 어려워져서",
    "연습을 많이 하면",
    "쉬워질 거예요",
  ]);
});
