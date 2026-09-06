import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import FlashcardsPage from "@/app/learning/trainers/flashcards/page";
import type { CategoryOption } from "@/features/dictionary/types";

const { getLearningContext, buildFlashcardQueue, fetchAllRows } = vi.hoisted(() => ({ getLearningContext: vi.fn(), buildFlashcardQueue: vi.fn(), fetchAllRows: vi.fn() }));
vi.mock("@/features/auth/getLearningContext", () => ({ getLearningContext }));
vi.mock("@/features/trainers/flashcards/buildQueue", () => ({ buildFlashcardQueue }));
vi.mock("@/lib/supabase/fetchAll", () => ({ fetchAllRows }));
vi.mock("@/features/trainers/flashcards/actions", () => ({ recordReview: vi.fn() }));
vi.mock("@/components/layout/GuestHeader", () => ({ GuestHeader: () => null }));
vi.mock("@/components/layout/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/components/ui/BottomTabBar", () => ({ BottomTabBar: () => null }));
vi.mock("@/features/trainers/flashcards/components/FlashcardsHeader", () => ({ FlashcardsHeader: () => null }));
vi.mock("@/features/trainers/flashcards/components/CategorySelect", () => ({
  CategorySelect: ({ categories }: { categories: CategoryOption[] }) => <div>{categories.map((c) => c.name).join(", ")}</div>,
}));
const profile = { active_language: "ko", srs_new_cards_per_session: 5 };
const props = { searchParams: Promise.resolve({}) };

beforeEach(() => {
  profile.active_language = "ko";
  profile.srs_new_cards_per_session = 5;
  const query = { select: () => query, eq: () => query, single: async () => ({ data: profile }) };
  getLearningContext.mockImplementation(async () => ({ user: { id: "user" }, username: "Test", activeLanguage: profile.active_language, newCardsLimit: profile.srs_new_cards_per_session, supabase: { from: () => query } }));
  fetchAllRows.mockResolvedValue([
    { categories: { id: "global", name: "Общая" }, words: { owner_user_id: null } },
    { categories: { id: "own", name: "Моя категория" }, words: { owner_user_id: "user" } },
    { categories: { id: "other", name: "Чужая категория" }, words: { owner_user_id: "other" } },
  ]);
  buildFlashcardQueue.mockImplementation(async (_client, _user, limit, language) => Array.from({ length: limit }, (_, i) => ({
    isNew: true,
    word: { id: String(i), headword: language === "ko" ? `학교${i}` : `school${i}`, language, reading: null,
      translations: [{ text: "школа" }], word_examples: [] },
  })));
});

it("сбрасывает открытую карточку при смене языка", async () => {
  const { rerender } = render(await FlashcardsPage(props));
  fireEvent.click(screen.getByRole("button", { name: "Показать ответ" }));
  profile.active_language = "en";
  rerender(await FlashcardsPage(props));
  expect(screen.getByText("school0")).toBeDefined();
  expect(screen.queryByText("школа")).toBeNull();
});

it("применяет новый лимит к текущей очереди", async () => {
  const { rerender } = render(await FlashcardsPage(props));
  expect(screen.getByText("1 / 5")).toBeDefined();
  profile.srs_new_cards_per_session = 10;
  rerender(await FlashcardsPage(props));
  expect(screen.getByText("1 / 10")).toBeDefined();
});

it("показывает категории собственных слов", async () => {
  render(await FlashcardsPage(props));
  expect(screen.getByText(/Моя категория/)).toBeDefined();
  expect(screen.queryByText(/Чужая категория/)).toBeNull();
});

it("открывает гостю карточки только общих категорий", async () => {
  getLearningContext.mockResolvedValue({ user: null, username: null, activeLanguage: "ko", newCardsLimit: 5, supabase: {} });
  render(await FlashcardsPage(props));
  expect(screen.getByRole("button", { name: "Показать ответ" })).toBeDefined();
  expect(screen.queryByText(/Моя категория/)).toBeNull();
  expect(buildFlashcardQueue).toHaveBeenCalledWith({}, null, 5, "ko", { categoryIds: undefined });
});
