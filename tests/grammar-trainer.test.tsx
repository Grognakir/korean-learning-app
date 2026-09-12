import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GrammarSession } from "@/features/trainers/grammar/components/GrammarSession";
import { GrammarSetup } from "@/features/trainers/grammar/components/GrammarSetup";
import type { GrammarSessionData } from "@/features/trainers/grammar/types";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const pattern = "AV-고 싶다";
const session: GrammarSessionData = {
  id: "session",
  study: [{
    id: "g1", pattern, meaning: "хотеть", category: "6. Модальность — возможность", explanation: "Желание **говорящего**.",
    rules: ["**-고 싶다** после основы глагола"], usage: [], examples: [{ kr: "집에 가고 싶어요.", ru: "Хочу домой." }],
    quiz: [{ base_kr: "저는 집에 가요.", base_ru: "Я иду домой.", task_ru: "Скажите, что хотите пойти домой.", answers: ["저는 집에 가고 싶어요.", "저는 집에 가고 싶습니다."] }],
  }],
  tasks: [
    { type: "cloze", pattern, item: { kr_before: "저는 집에", kr_after: ".", ru: "Я хочу домой.", options: ["가고 싶어요", "갔어요"], correct: 0 } },
    {
      type: "match",
      pairs: [{ kr: "가고 싶어요", ru: "хочу пойти", pattern }, { kr: "먹고 싶어요", ru: "хочу есть", pattern }],
      ru: ["хочу есть", "хочу пойти"],
    },
    { type: "drill", pattern, item: { base_kr: "저는 밥을 먹어요.", base_ru: "Я ем.", task_ru: "Скажите, что хотите есть.", answers: ["저는 밥을 먹고 싶어요.", "저는 밥을 먹고 싶습니다."] } },
  ],
  blitz: [{ dir: "kr", pattern, prompt: "가고 싶어요", answer: "хочу пойти", options: ["могу пойти", "хочу пойти"] }],
};

beforeEach(() => {
  vi.useFakeTimers();
  window.scrollTo = vi.fn();
});
afterEach(() => vi.useRealTimers());

it("проводит через изучение, практику и блиц к итогам с ошибками", () => {
  render(<GrammarSession session={session} blitzSeconds={1} setupHref="/learning/trainers/grammar?count=5&blitz=1" />);

  expect(screen.getByRole("heading", { name: pattern })).toBeDefined();
  expect(screen.getByText("говорящего").tagName).toBe("STRONG");
  fireEvent.click(screen.getByRole("button", { name: "Продолжить" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Скажите, что хотите пойти домой." }), { target: { value: "저는 집에 가고 싶습니다" } });
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));
  expect(screen.getByText("Всё верно")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "К практике" }));

  expect(screen.getByText("저는 집에 _____.")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "갔어요" }));
  expect(screen.getByRole("button", { name: "가고 싶어요" }).className).toContain("optionOk");
  fireEvent.click(screen.getByRole("button", { name: "Далее" }));

  const next = () => screen.getByRole("button", { name: "Далее" });
  fireEvent.click(screen.getByRole("button", { name: "가고 싶어요" }));
  fireEvent.click(screen.getByRole("button", { name: "хочу есть" }));
  expect(next().hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "хочу пойти" }));
  fireEvent.click(screen.getByRole("button", { name: "가고 싶어요" }));
  fireEvent.click(screen.getByRole("button", { name: "먹고 싶어요" }));
  fireEvent.click(screen.getByRole("button", { name: "хочу есть" }));
  expect(next().hasAttribute("disabled")).toBe(false);
  fireEvent.click(next());

  fireEvent.change(screen.getByRole("textbox", { name: "Скажите, что хотите есть." }), { target: { value: "저는 밥을 먹어요" } });
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));
  expect(screen.getByText("Неверно")).toBeDefined();
  expect(screen.getByText("также верно: 저는 밥을 먹고 싶습니다.")).toBeDefined();
  fireEvent.click(next());

  expect(screen.getByText("Что значит?")).toBeDefined();
  act(() => vi.advanceTimersByTime(1100));
  expect(screen.getByRole("button", { name: "хочу пойти" }).className).toContain("optionOk");
  act(() => vi.advanceTimersByTime(1000));

  expect(screen.getByText("Сессия завершена")).toBeDefined();
  expect(screen.getByText("1/1")).toBeDefined();
  expect(screen.getByText("2/5")).toBeDefined();
  expect(screen.getByText("0/1")).toBeDefined();
  expect(screen.getByText("Ошибки — 4")).toBeDefined();
  expect(screen.getByText("— не успели —")).toBeDefined();
  expect(screen.getByRole("link", { name: "Новая сессия" }).getAttribute("href")).toBe("/learning/trainers/grammar?count=5&blitz=1");
});

it("в блице засчитывает выбранный вариант и переходит дальше", () => {
  render(<GrammarSession session={{ ...session, study: session.study, tasks: [] }} blitzSeconds={3} setupHref="/" />);
  fireEvent.click(screen.getByRole("button", { name: "Продолжить" }));
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));
  expect(screen.getByText("Верно 0 из 1")).toBeDefined();
  expect(screen.getByText("— пусто —")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "К блицу" }));
  fireEvent.click(screen.getByRole("button", { name: "хочу пойти" }));
  act(() => vi.advanceTimersByTime(400));
  expect(screen.getByText("1/1")).toBeDefined();
});

const areas = [
  { key: "3", label: "Время и вид глагола", count: 5 },
  { key: "4", label: "Отрицание", count: 2 },
  { key: "6", label: "Модальность", count: 3 },
  { key: "7", label: "Обращение", count: 2 },
];

it("связывает количество грамматик с выбранными областями", () => {
  render(<GrammarSetup areas={areas} initial={{ areas: areas.map((a) => a.key), count: 8, blitz: 3 }} />);

  const slider = screen.getByRole("slider", { name: "Грамматик в сессии" }) as HTMLInputElement;
  expect([slider.min, slider.max, slider.value]).toEqual(["5", "12", "8"]);
  expect(screen.getByText("32 вопроса · 1:36")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "2 с" }));
  expect(screen.getByText("32 вопроса · 1:04")).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Область" }));
  fireEvent.click(screen.getByRole("button", { name: "Сбросить" }));
  expect(screen.queryByRole("slider")).toBeNull();
  expect(screen.getByText("Выберите хотя бы одну область")).toBeDefined();
  expect(screen.getByRole("button", { name: "Выберите область" }).hasAttribute("disabled")).toBe(true);

  const list = screen.getByRole("listbox", { name: "Область" });
  fireEvent.click(within(list).getByRole("option", { name: /Отрицание/ }));
  expect(screen.getByText("В области меньше 5 — в сессию войдут все")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Начать · 2 грамматики" }));
  expect(push).toHaveBeenCalledWith("/learning/trainers/grammar/session?areas=4&count=2&blitz=2");

  fireEvent.click(screen.getByRole("button", { name: "Выбрать все" }));
  expect(screen.getByRole("slider")).toBeDefined();
});
