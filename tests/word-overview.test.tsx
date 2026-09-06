import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { WordOverviewCard } from "@/features/dashboard/WordOverviewCard";

it("предлагает первую тренировку без фиктивного прогресса", () => {
  render(<WordOverviewCard overview={{ total: 100, reviewed: 0, due: 0 }} />);
  expect(screen.getByRole("link", { name: "Начать первую тренировку" }).getAttribute("href")).toBe("/learning/trainers/flashcards");
});
it("показывает количество готовых к повторению слов", () => {
  render(<WordOverviewCard overview={{ total: 100, reviewed: 20, due: 7 }} />);
  expect(screen.getByText("7")).toBeDefined();
  expect(screen.getByRole("link", { name: "Повторять" })).toBeDefined();
});
it("не предлагает пустую тренировку после всех повторений", () => {
  render(<WordOverviewCard overview={{ total: 20, reviewed: 20, due: 0 }} />);
  expect(screen.getByText("Все повторения выполнены")).toBeDefined();
  expect(screen.queryByRole("link")).toBeNull();
});
it("при пустом словаре предлагает добавить слова", () => {
  render(<WordOverviewCard overview={{ total: 0, reviewed: 0, due: 0 }} />);
  expect(screen.getByRole("link", { name: "Открыть словарь" })).toBeDefined();
});
it("отличает ошибку загрузки от отсутствия прогресса", () => {
  render(<WordOverviewCard overview={null} />);
  expect(screen.getByRole("status").textContent).toContain("Не удалось");
});
