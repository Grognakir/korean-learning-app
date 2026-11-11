import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { expect, it } from "vitest";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import type { Block } from "@/features/learning/types";

it("в строгом режиме React подсказки слов не пропадают в строках текста и при выделении слога целиком", () => {
  const blocks = [
    {
      type: "text",
      id: "t",
      text_kind: "dialogue",
      lines: [{ text: "시험이 며칠 안 남아서 쉴 수가 없어요." }],
      vocab: [{ ko: "남다", translation_ru: "оставаться" }],
    },
    {
      type: "grammar_exercise",
      id: "e",
      exercise_title: "연습하기1",
      grammar_ref: "g",
      prompt: "p",
      template: [],
      items: [],
      example: {
        given: ["x"],
        dialogue: ["가: 이 약을 먹고 나면 건강해질 거예요."],
        emphasis: [["고 나면", "질 거예요"]],
        vocab: [{ ko: "건강해질", translation_ru: "становиться здоровым" }],
      },
    },
  ] as unknown as Block[];
  const { container } = render(
    <StrictMode>
      <PageBlocks blocks={blocks} />
    </StrictMode>,
  );
  const tips = [...container.querySelectorAll("[role=tooltip]")].map((el) => el.textContent);
  expect(tips).toContain("оставаться");
  expect(tips).toContain("становиться здоровым");
  const emphasized = [...container.querySelectorAll("[class*='exerciseEmphasis']")].map(
    (el) => el.textContent,
  );
  expect(emphasized.join("")).toContain("질");
});
