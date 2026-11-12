import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { FlashcardSession } from "@/features/trainers/flashcards/components/FlashcardSession";
import type { Word } from "@/features/dictionary/types";

const { recordReview } = vi.hoisted(() => ({ recordReview: vi.fn() }));
vi.mock("@/features/trainers/flashcards/actions", () => ({ recordReview }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const word: Word = {
  id: "word", headword: "학교", reading: null,
  part_of_speech: null, owner_user_id: null, translations: [{ text: "школа" }],
  word_categories: [], word_examples: [], word_notes: [], word_forms: [],
};
beforeEach(() => { recordReview.mockReset(); router.refresh.mockReset(); });

it("не завершает сессию, пока последняя оценка не сохранена", async () => {
  let resolve!: (value: { ok: boolean }) => void;
  recordReview.mockImplementation(() => new Promise((r) => { resolve = r; }));
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  expect(screen.queryByText("Сессия завершена")).toBeNull();
  expect(screen.getByRole("button", { name: "Хорошо" }).hasAttribute("disabled")).toBe(true);
  await act(async () => resolve({ ok: true }));
  expect(screen.getByText("Сессия завершена")).toBeDefined();
});

it("оставляет карточку открытой при ошибке записи и позволяет повторить", async () => {
  recordReview.mockResolvedValueOnce({ error: "offline" }).mockResolvedValueOnce({ ok: true });
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
  expect(recordReview).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Сессия завершена")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  await waitFor(() => expect(screen.getByText("Сессия завершена")).toBeDefined());
});

it("возвращает забытую карточку, но повторную оценку не записывает", async () => {
  recordReview.mockResolvedValue({ ok: true });
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Забыл" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Показать ответ" })).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  await waitFor(() => expect(screen.getByText("Сессия завершена")).toBeDefined());
  expect(recordReview.mock.calls).toEqual([["word", "again"]]);
});

it("не отправляет несколько оценок, пока идёт сохранение", async () => {
  let resolve!: (value: { ok: boolean }) => void;
  recordReview.mockImplementation(() => new Promise((r) => { resolve = r; }));
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  fireEvent.click(screen.getByRole("button", { name: "Легко" }));
  expect(recordReview).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ ok: true }));
});

it("в обратном направлении скрывает слово до переворота", () => {
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Перевод → слово" }));
  expect(screen.getByText("школа")).toBeDefined();
  expect(screen.queryByText("학교")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  expect(screen.getByText("학교")).toBeDefined();
  expect(recordReview).not.toHaveBeenCalled();
});

it("при смене направления закрывает ответ, сохраняя прогресс сессии", () => {
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Перевод → слово" }));
  expect(screen.getByRole("button", { name: "Показать ответ" })).toBeDefined();
  expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  expect(screen.getByRole("button", { name: "Хорошо" }).hasAttribute("disabled")).toBe(true);
});

it("сразу показывает оценки, но включает их только после переворота", () => {
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  expect(screen.queryByText("Вспомните перевод")).toBeNull();
  expect(screen.queryByText("Ответ")).toBeNull();
  expect(screen.getByRole("button", { name: "Хорошо" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  expect(screen.getByRole("button", { name: "Хорошо" }).hasAttribute("disabled")).toBe(false);
});

it("позволяет гостю повторить забытую карту без записи в аккаунт", async () => {
  render(<FlashcardSession guest queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Забыл" }));
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  expect(screen.getByText("Сессия завершена")).toBeDefined();
  expect(screen.queryByText(/ответа сохранено/)).toBeNull();
  expect(recordReview).not.toHaveBeenCalled();
});

it("«Трудно» возвращает карточку и записывается как сброс", async () => {
  recordReview.mockResolvedValue({ ok: true });
  render(<FlashcardSession queue={[{ word, isNew: false }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Трудно" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Показать ответ" })).toBeDefined());
  expect(recordReview.mock.calls).toEqual([["word", "hard"]]);
});

it("повторный показ слова в другой паре после «Хорошо» не записывается, а «Забыл» записывается", async () => {
  recordReview.mockResolvedValue({ ok: true });
  render(<FlashcardSession queue={[{ word, isNew: true }, { word, isNew: true }, { word, isNew: true }]} />);
  for (const label of ["Хорошо", "Легко", "Забыл"]) {
    fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Показать ответ" })).toBeDefined());
  }
  expect(recordReview.mock.calls).toEqual([["word", "good"], ["word", "again"]]);
});

it("после неудачной записи следующий ответ по слову записывается", async () => {
  recordReview.mockResolvedValueOnce({ error: "offline" }).mockResolvedValue({ ok: true });
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  await waitFor(() => expect(screen.getByText("Сессия завершена")).toBeDefined());
  expect(recordReview).toHaveBeenCalledTimes(2);
});

it("итоги не меняются, когда после обновления приходит другая очередь, и страница обновляется один раз", async () => {
  recordReview.mockResolvedValue({ ok: true });
  const { rerender } = render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  await waitFor(() => expect(screen.getByText("Сессия завершена")).toBeDefined());
  rerender(<FlashcardSession queue={[]} />);
  expect(screen.getByText("Карточек: 1, из них новых: 1.")).toBeDefined();
  expect(router.refresh).toHaveBeenCalledTimes(1);
});

it("гость не обновляет страницу после сессии", () => {
  render(<FlashcardSession guest queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  expect(router.refresh).not.toHaveBeenCalled();
});
