import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ShortWritingExercise } from "@/features/learning/components/blocks/ShortWritingExercise";
import type { ShortWritingExerciseBlock } from "@/features/learning/types";

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const block: ShortWritingExerciseBlock = {
  id: "short-writing-test",
  type: "short_writing_exercise",
  title: "짧은 글 쓰기",
  expressions: [{ ko: "증가하다", translation_ru: "увеличиваться" }],
  tasks: [
    {
      prompt: "다음을 보고 '이용률의 변화'에 대해서 비교하는 글을 140~200자로 쓰십시오.",
      table: { head: ["", "2010년", "2020년"], rows: [["편의점", "70%", "95%"]] },
      reasons: { label: "증가한 이유", items: ["운동이 부족함"] },
    },
    { prompt: "두 번째", table: { head: ["", "2010년"], rows: [["백화점", "60%"]] } },
  ],
};

it("показывает данные, причины и отдельное поле письма для каждого задания", () => {
  render(<ShortWritingExercise block={block} textbookSlug="book" lessonNumber={7} />);
  expect(screen.getByText("증가하다")).toBeTruthy();
  expect(screen.getByText("편의점")).toBeTruthy();
  expect(screen.getByText("운동이 부족함")).toBeTruthy();
  expect(screen.getAllByRole("textbox", { name: "Текст сочинения" })).toHaveLength(2);
});

it("сохраняет черновик каждого задания отдельно по уроку", () => {
  const page = (lesson: number) => <ShortWritingExercise block={block} textbookSlug="book" lessonNumber={lesson} />;
  render(page(7));
  fireEvent.change(screen.getAllByRole("textbox", { name: "Текст сочинения" })[1], { target: { value: "백화점" } });
  cleanup();
  render(page(8));
  expect((screen.getAllByRole("textbox", { name: "Текст сочинения" })[1] as HTMLTextAreaElement).value).toBe("");
  cleanup();
  render(page(7));
  const boxes = screen.getAllByRole("textbox", { name: "Текст сочинения" }) as HTMLTextAreaElement[];
  expect(boxes[0].value).toBe("");
  expect(boxes[1].value).toBe("백화점");
});
