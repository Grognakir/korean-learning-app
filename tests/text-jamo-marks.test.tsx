import { cleanup, render } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import type { Block } from "@/features/learning/types";

it("рамка с буквой стоит после слога в строке текста и не ломает остальной текст", () => {
  const blocks: Block[] = [
    {
      id: "dialogue",
      type: "text",
      text_kind: "dialogue",
      lines: [
        {
          text: "건강해질 거예요.",
          emphasized: ["거예요"],
          jamo_marks: [{ text: "질", jamo: "ㄹ" }],
        },
        { text: "또 하루가 갔어요.", jamo_marks: [{ text: "없는", jamo: "ㄴ" }] },
      ],
    },
  ];
  const { container } = render(<PageBlocks blocks={blocks} />);
  const chips = container.querySelectorAll("[class*='jamoChip']");
  expect(chips).toHaveLength(1);
  expect(chips[0].textContent).toBe("ㄹ");
  expect(chips[0].previousSibling?.textContent).toContain("질");
  expect(container.textContent).toContain("건강해질ㄹ 거예요.");
  expect(container.textContent).toContain("또 하루가 갔어요.");
  cleanup();
});
