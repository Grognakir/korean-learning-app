import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

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
import { markOpen, readGame, writeGame } from "@/features/lessonSticker/session";

beforeEach(() => window.sessionStorage.clear());

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

it("после перезагрузки окно игры открывается снова, пока его не закрыли", () => {
  markOpen("interview");
  const { unmount } = render(<LessonSticker config={{ character: "jia-call", trainer: "interview" }} />);
  expect(screen.getByRole("dialog")).toBeTruthy();
  unmount();

  render(<LessonSticker config={{ character: "jia-call", trainer: "interview" }} />);
  expect(screen.getByRole("dialog")).toBeTruthy();
  writeGame("interview", { episodeId: "rain", index: 3 });
  fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(readGame("interview")).toBeNull();

  render(<LessonSticker config={{ character: "jia-call", trainer: "interview" }} />);
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("не открывает окно на другой странице", () => {
  window.sessionStorage.setItem(
    "lesson-sticker:open:interview",
    JSON.stringify({ path: "/somewhere-else", at: Date.now() }),
  );
  render(<LessonSticker config={{ character: "jia-call", trainer: "interview" }} />);
  expect(screen.queryByRole("dialog")).toBeNull();
});
