import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import { vocabKeysInText } from "@/features/learning/components/blocks/vocabHighlight";
import type { Block } from "@/features/learning/types";

it("показывает перевод слова только при первом употреблении в разделе", () => {
  const blocks: Block[] = [
    {
      id: "vocab",
      type: "vocab_list",
      title: "단어",
      related_text_ref: "dialogue",
      items: [{ ko: "개월", translation_ru: "месяц" }],
    },
    {
      id: "dialogue",
      type: "text",
      text_kind: "dialogue",
      lines: [{ text: "3개월이 됐어요." }, { text: "4개월이 지났어요." }],
    },
    {
      id: "grammar",
      type: "grammar_point",
      pattern: "AV-(으)ㄴ 지",
      section: "1",
      explanation: null,
      examples: ["6개월이 됐어요."],
    },
    {
      id: "exercise",
      type: "grammar_exercise",
      exercise_title: "연습하기",
      grammar_ref: "grammar",
      prompt: "말해 보세요.",
      example: { given: ["9개월"], dialogue: ["9개월이 됐어요."] },
      template: ["{0}이 됐어요."],
      items: [{ given: ["12개월"], answers: ["12개월"] }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  expect(container.querySelectorAll('[class*="inlineVocab"]')).toHaveLength(1);
});

it("подключает локальный словарь к примеру конкретного упражнения", () => {
  const blocks: Block[] = [
    {
      id: "exercise",
      type: "grammar_exercise",
      exercise_title: "연습하기",
      grammar_ref: "grammar",
      prompt: "말해 보세요.",
      example: {
        given: ["목소리"],
        dialogue: ["목소리가 작아요."],
        vocab: [{ ko: "목소리", translation_ru: "голос" }],
      },
      template: ["{0}가 작아요."],
      items: [{ given: ["소리"], answers: ["소리"] }],
    },
  ];

  const { container } = render(<PageBlocks blocks={blocks} />);
  expect(container.querySelector('[class*="inlineVocab"]')?.textContent).toBe("목소리голос");
});

it("находит словарные формы в реальных примерах упражнений", () => {
  expect(
    vocabKeysInText("목소리가 너무 작으니까 크게 이야기하세요.", [
      { ko: "목소리", translation_ru: "голос" },
      { ko: "너무", translation_ru: "слишком, очень" },
      { ko: "작다", translation_ru: "быть тихим, маленьким" },
      { ko: "크다", translation_ru: "быть громким, большим" },
    ]),
  ).toEqual(["목소리", "너무", "작다", "크다"]);

  expect(
    vocabKeysInText("머리를 어떻게 자를 거예요?", [
      { ko: "머리", translation_ru: "голова, волосы" },
      { ko: "자르다", translation_ru: "стричь, резать" },
      { ko: "자를", translation_ru: "стричь, резать (форма от 자르다)" },
    ]),
  ).toEqual(["머리", "자를"]);
});
