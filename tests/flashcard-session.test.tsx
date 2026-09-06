import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { FlashcardSession } from "@/features/trainers/flashcards/components/FlashcardSession";
import type { Word } from "@/features/dictionary/types";

const { recordReview } = vi.hoisted(() => ({ recordReview: vi.fn() }));
vi.mock("@/features/trainers/flashcards/actions", () => ({ recordReview }));
const word: Word = {
  id: "word", headword: "학교", language: "ko", reading: null,
  part_of_speech: null, owner_user_id: null, translations: [{ text: "школа" }],
  word_categories: [], word_examples: [], word_notes: [], word_forms: [],
};
beforeEach(() => { recordReview.mockReset(); });

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

it("возвращает забытую карточку и сохраняет её повторную оценку", async () => {
  recordReview.mockResolvedValue({ ok: true });
  render(<FlashcardSession queue={[{ word, isNew: true }]} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Забыл" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Показать ответ" })).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  fireEvent.click(screen.getByRole("button", { name: "Хорошо" }));
  await waitFor(() => expect(screen.getByText("Сессия завершена")).toBeDefined());
  expect(recordReview.mock.calls).toEqual([["word", "again"], ["word", "good"]]);
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
  expect(screen.queryByRole("button", { name: "Хорошо" })).toBeNull();
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
