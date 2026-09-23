// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

type LessonBlock = {
  id?: string;
  lines?: { text: string }[];
  questions?: { prompt: string; choices?: string[]; correct?: number | null }[];
  followup?: string;
};

const lesson = JSON.parse(
  readFileSync(
    join(process.cwd(), "content/reference/inha_book_content/2급_lesson_03/lesson-03.json"),
    "utf8",
  ),
) as { pages: { blocks: LessonBlock[] }[] };
const blocks = lesson.pages.flatMap((page) => page.blocks);

it("дословно хранит текст чтения со страницы 52", () => {
  expect(blocks.find((block) => block.id === "text-reading-racer")?.lines).toEqual([
    {
      text: "저는 어렸을 때부터 자동차를 좋아했습니다. 그래서 늘 장난감 자동차를 가지고 놀았습니다. 고등학생 때 저는 자동차 경주를 처음 봤습니다. 자동차 소리와 사람들이 응원하는 목소리를 들었을 때 저는 아주 기분이 좋았습니다. 그때부터 저는 자동차 레이서가 (ㄱ). 저는 집에 돌아가서 어머니께 제 꿈에 대해서 말씀드렸습니다. 어머니께서는 저를 응원해 주셨습니다.",
    },
    {
      text: "저는 제 꿈을 이루려고 노력하고 있습니다. 그래서 요즘 9시간 동안 자동차 운전을 연습을 하고 있습니다. 저는 자동차 경주에서 꼭 우승을 할 겁니다.",
    },
  ]);
});

it("сохраняет вопросы и ответы со страницы 52", () => {
  const exercise = blocks.find((block) => block.id === "reading-racer-questions");

  expect(exercise?.questions).toEqual([
    {
      kind: "choice",
      prompt: "1) ㉠에 들어갈 알맞은 말을 고르십시오.",
      choices: ["될 겁니다", "되었습니다", "되기로 합니다", "되기로 했습니다"],
      correct: 3,
    },
    {
      kind: "choice",
      prompt: "2) 이 글의 내용과 같은 것을 고르십시오.",
      choices: [
        "이 사람은 자동차 경주 선수가 되었습니다.",
        "이 사람은 고등학생 때 자동차를 샀습니다.",
        "이 사람은 자동차를 탈 때 기분이 좋았습니다.",
        "이 사람은 자동차 경주에서 우승하고 싶어 합니다.",
      ],
      correct: 3,
    },
  ]);
  expect(exercise?.followup).toBe("여러분의 꿈이 무엇입니까? 이야기해 보십시오.");
});
