import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import FlashcardsPage from "@/app/learning/trainers/flashcards/page";
import type { CategoryOption } from "@/features/dictionary/types";

const { getLearningContext, buildFlashcardQueueWithStats, fetchAllRows } = vi.hoisted(() => ({ getLearningContext: vi.fn(), buildFlashcardQueueWithStats: vi.fn(), fetchAllRows: vi.fn() }));
vi.mock("@/features/auth/getLearningContext", () => ({ getLearningContext }));
vi.mock("@/features/trainers/flashcards/buildQueue", () => ({ buildFlashcardQueueWithStats }));
vi.mock("@/lib/supabase/fetchAll", () => ({ fetchAllRows }));
vi.mock("@/features/trainers/flashcards/actions", () => ({ recordReview: vi.fn() }));
vi.mock("@/components/layout/GuestHeader", () => ({ GuestHeader: () => null }));
vi.mock("@/components/layout/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/components/ui/BottomTabBar", () => ({ BottomTabBar: () => null }));
vi.mock("@/features/trainers/flashcards/components/FlashcardsHeader", () => ({ FlashcardsHeader: () => null }));
vi.mock("@/features/trainers/flashcards/components/CategorySelect", () => ({
  CategorySelect: ({ categories }: { categories: CategoryOption[] }) => <div>{categories.map((c) => c.name).join(", ")}</div>,
}));
const profile = { srs_new_cards_per_session: 5 };
const props = { searchParams: Promise.resolve({}) };

beforeEach(() => {
  profile.srs_new_cards_per_session = 5;
  const query = { select: () => query, eq: () => query, single: async () => ({ data: profile }) };
  getLearningContext.mockImplementation(async () => ({ user: { id: "user" }, username: "Test", newCardsLimit: profile.srs_new_cards_per_session, supabase: { from: () => query } }));
  fetchAllRows.mockResolvedValue([
    { categories: { id: "global", name: "Общая" }, words: { owner_user_id: null } },
    { categories: { id: "own", name: "Моя категория" }, words: { owner_user_id: "user" } },
    { categories: { id: "other", name: "Чужая категория" }, words: { owner_user_id: "other" } },
  ]);
  buildFlashcardQueueWithStats.mockImplementation(async (_client, _user, limit) => ({
    availableNewCount: limit,
    queue: Array.from({ length: limit }, (_, i) => ({
      isNew: true,
      word: { id: String(i), headword: `학교${i}`, reading: null,
        translations: [{ text: "школа" }], word_examples: [] },
    })),
  }));
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
  getLearningContext.mockResolvedValue({ user: null, username: null, newCardsLimit: 5, supabase: {} });
  render(await FlashcardsPage(props));
  expect(screen.getByRole("button", { name: "Показать ответ" })).toBeDefined();
  expect(screen.queryByText(/Моя категория/)).toBeNull();
  expect(buildFlashcardQueueWithStats).toHaveBeenCalledWith({}, null, 5, { categoryIds: undefined });
});

it("показывает фактический лимит выбранной подборки", async () => {
  profile.srs_new_cards_per_session = 50;
  buildFlashcardQueueWithStats.mockResolvedValue({
    availableNewCount: 21,
    queue: Array.from({ length: 21 }, (_, i) => ({
      isNew: true,
      word: { id: String(i), headword: `학교${i}`, reading: null,
        translations: [{ text: "школа" }], word_examples: [] },
    })),
  });

  render(await FlashcardsPage(props));
  expect(screen.getByRole("button", { name: /21 новых/ })).toBeDefined();
});
