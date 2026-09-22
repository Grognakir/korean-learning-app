import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TypeRunner } from "@/features/topics/questions/trainer/TypeRunner";
import { WORDS } from "@/features/topics/questions/trainer/data";

function renderRunner() {
  render(<TypeRunner title="Напишите слово" onBack={vi.fn()} />);
}

function currentWord() {
  const word = WORDS.find((candidate) => screen.queryByText(candidate.ru));
  if (!word) throw new Error("Не найдено текущее слово тренажёра");
  return word;
}

it("сразу переходит дальше после верно написанного слова", () => {
  renderRunner();
  const word = currentWord();

  fireEvent.change(screen.getByRole("textbox"), { target: { value: word.answers[0] } });
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));

  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("button", { name: "Далее" })).toBeNull();
  expect(screen.queryByText(word.ru)).toBeNull();
});

it("после ошибки показывает правильный ответ и кнопку перехода", () => {
  renderRunner();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "неверный ответ" } });
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));

  expect(screen.getByRole("status").textContent).toContain("Правильный ответ:");
  expect(screen.getByRole("button", { name: "Далее" })).toBeDefined();
});
