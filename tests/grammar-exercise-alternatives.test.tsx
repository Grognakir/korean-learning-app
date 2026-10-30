import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import type { Block } from "@/features/learning/types";

afterEach(cleanup);

const blocks: Block[] = [
  {
    id: "exercise",
    type: "grammar_exercise",
    exercise_title: "연습하기",
    grammar_ref: "grammar",
    prompt: "다음과 같이 이야기해 보십시오.",
    example: { given: ["노랗다"], dialogue: ["노란 옷을 샀어요."] },
    template: ["하늘이 더 {0}."],
    items: [
      {
        given: ["파랗다 [-네요]"],
        answers: ["파랗네요"],
        alternatives: [["파라네요"]],
      },
    ],
  },
];

function check(answer: string) {
  const { container, getByText } = render(<PageBlocks blocks={blocks} />);
  fireEvent.click(getByText(/파랗다/));
  const input = container.querySelector("input")!;
  fireEvent.change(input, { target: { value: answer } });
  fireEvent.click(getByText("Проверить"));
  return container.textContent ?? "";
}

it("засчитывает основной и альтернативный ответ", () => {
  expect(check("파랗네요")).toContain("✓ Верно!");
  cleanup();
  expect(check("파라네요")).toContain("✓ Верно!");
});

it("не засчитывает посторонний ответ и показывает основной", () => {
  const text = check("파래요");
  expect(text).toContain("✕ Неверно");
  expect(text).toContain("파랗네요");
});
