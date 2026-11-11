import { cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { expect, it } from "vitest";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import type { Block } from "@/features/learning/types";

it("зачёркивает указанный фрагмент строки и оставляет остальной текст", () => {
  const blocks: Block[] = [
    {
      id: "rules",
      type: "text",
      text_kind: "passage",
      lines: [
        {
          text: "3. 교실에서 한국어만 쓴다. ⇒ 수업 시간에 한국어로만 말한다.",
          struck: ["교실에서 한국어만 쓴다."],
          emphasized: ["쓴다", "한다"],
        },
      ],
    },
  ];
  const { container } = render(
    <StrictMode>
      <PageBlocks blocks={blocks} />
    </StrictMode>,
  );
  const struck = container.querySelectorAll("s");
  expect(struck).toHaveLength(1);
  expect(struck[0].textContent).toBe("교실에서 한국어만 쓴다.");
  expect(container.textContent).toContain("⇒ 수업 시간에 한국어로만 말한다.");
  cleanup();
});
