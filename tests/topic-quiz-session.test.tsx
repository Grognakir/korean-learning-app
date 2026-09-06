import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { TopicQuizSession } from "@/features/trainers/topics/components/TopicQuizSession";
import type { TopicQuizQuestion } from "@/features/trainers/topics/types";

const questions: TopicQuizQuestion[] = [
  { id: "one", topic: "test", question_text: "Выберите школу", before_text: null, after_text: null, options: ["학교", "집"], correct: "학교", translation_ru: "Школа", hint: [{ kr: "학교", ru: "школа" }] },
  { id: "two", topic: "test", question_text: "Выберите дом", before_text: null, after_text: null, options: ["집", "물"], correct: "집", translation_ru: null, hint: null },
];

function answer(value: string, last = false) {
  fireEvent.click(screen.getByRole("button", { name: value }));
  fireEvent.click(screen.getByRole("button", { name: last ? "Посмотреть результат" : "Далее" }));
}

it("показывает явное объяснение ошибки и блокирует замену ответа", () => {
  render(<TopicQuizSession questions={questions} />);
  fireEvent.click(screen.getByRole("button", { name: "집" }));
  expect(screen.getByRole("status").textContent).toContain("Правильный ответ:");
  expect(within(screen.getByRole("status")).getByText("학교")).toBeDefined();
  expect(screen.getByRole("button", { name: "학교" }).hasAttribute("disabled")).toBe(true);
});

it("предлагает повтор только ошибочных вопросов и затем всю тему заново", () => {
  render(<TopicQuizSession questions={questions} />);
  answer("집");
  answer("집", true);
  expect(screen.getByText("1 из 2 верно")).toBeDefined();
  expect(within(screen.getByRole("region", { name: "Разбор ошибок" })).getByText("Выберите школу")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Повторить ошибки (1)" }));
  expect(screen.getByText("Выберите школу")).toBeDefined();
  expect(screen.getByText("1 / 1")).toBeDefined();
  answer("학교", true);
  expect(screen.getByText("1 из 1 верно")).toBeDefined();
  expect(screen.queryByRole("button", { name: /Повторить ошибки/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Пройти заново" }));
  expect(screen.getByText("1 / 2")).toBeDefined();
  expect(screen.getByText("Выберите школу")).toBeDefined();
});

it("не начисляет результат дважды при повторном нажатии Далее", () => {
  render(<TopicQuizSession questions={questions} />);
  fireEvent.click(screen.getByRole("button", { name: "학교" }));
  const next = screen.getByRole("button", { name: "Далее" });
  act(() => { fireEvent.click(next); fireEvent.click(next); });
  expect(screen.getByText("Выберите дом")).toBeDefined();
  answer("집", true);
  expect(screen.getByText("2 из 2 верно")).toBeDefined();
});

it("заполняет пропуск выбранным ответом", () => {
  render(<TopicQuizSession questions={[{ ...questions[0], question_text: null, before_text: "저는", after_text: "에 가요." }]} />);
  expect(screen.getByText("…")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "학교" }));
  expect(screen.queryByText("…")).toBeNull();
  expect(screen.getByRole("status").textContent).toBe("Верно!");
});

it("при отсутствии вопросов предлагает выбрать другую тему", () => {
  render(<TopicQuizSession questions={[]} />);
  expect(screen.getByRole("link", { name: "Выбрать тему →" }).getAttribute("href")).toBe("/learning/trainers/topics");
  expect(screen.queryByRole("progressbar")).toBeNull();
});
