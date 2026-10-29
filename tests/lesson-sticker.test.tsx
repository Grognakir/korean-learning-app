import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/features/lessonSticker/trainers", () => ({
  TRAINERS: {
    interview: {
      title: "Входящий звонок",
      total: 1,
      Component: () => <p>игра</p>,
    },
  },
}));

import { LessonSticker } from "@/features/lessonSticker/LessonSticker";
import { emotionSrc } from "@/features/lessonSticker/characters";

it("открывает окно игры по нажатию на стикер", () => {
  render(<LessonSticker config={{ character: "jia-call", trainer: "interview" }} />);
  expect(screen.queryByText("игра")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Входящий звонок" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByText("игра")).toBeTruthy();
});

it("ничего не рендерит для неизвестного персонажа или тренажёра", () => {
  const { container } = render(
    <LessonSticker config={{ character: "nobody", trainer: "interview" }} />,
  );
  expect(container.innerHTML).toBe("");
});

it("эмоция без картинки показывается как idle", () => {
  const character = { base: "/x", emotions: ["idle" as const], alt: "" };
  expect(emotionSrc(character, "ringing")).toBe("/x/idle.png");
});
