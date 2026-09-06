import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordReview, updateNewCardsLimit } from "@/features/trainers/flashcards/actions";
import type { Sm2Rating } from "@/features/trainers/flashcards/sm2";

const { createClient, revalidatePath, setCookie } = vi.hoisted(() => ({
  createClient: vi.fn(), revalidatePath: vi.fn(), setCookie: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: setCookie }) }));
vi.mock("next/cache", () => ({ revalidatePath }));

const wordId = "11111111-1111-4111-8111-111111111111";
const query = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn().mockReturnThis(),
};
const getUser = vi.fn();
const from = vi.fn(() => query);

beforeEach(() => {
  getUser.mockResolvedValue({ data: { user: { id: "user" } } });
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  query.upsert.mockResolvedValue({ error: null });
  createClient.mockResolvedValue({ auth: { getUser }, from });
});

describe("сохранение прогресса", () => {
  it("не перезаписывает прогресс, когда не удалось прочитать прежнее состояние", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: { message: "Database unavailable" } });
    expect(await recordReview(wordId, "good")).toEqual({ error: "Database unavailable" });
    expect(query.upsert).not.toHaveBeenCalled();
  });

  it("отклоняет неизвестную оценку до обращения к базе", async () => {
    expect(await recordReview(wordId, "invalid" as Sm2Rating)).toHaveProperty("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("отклоняет некорректный идентификатор слова", async () => {
    expect(await recordReview("invalid", "good")).toHaveProperty("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("продолжает интервалы существующего слова", async () => {
    query.maybeSingle.mockResolvedValue({ data: { ease_factor: 2.5, interval_days: 6, repetitions: 2 }, error: null });
    expect(await recordReview(wordId, "good")).toEqual({ ok: true });
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user", word_id: wordId, repetitions: 3, interval_days: 15, last_rating: "good",
    }), { onConflict: "user_id,word_id" });
  });

  it("не записывает прогресс без авторизации", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await recordReview(wordId, "good")).toHaveProperty("error");
    expect(from).not.toHaveBeenCalled();
  });

  it.each([NaN, Infinity, -Infinity])("не сохраняет нечисловой лимит %s", async (limit) => {
    expect(await updateNewCardsLimit(limit)).toHaveProperty("error");
    expect(createClient).not.toHaveBeenCalled();
  });
});

it("сохраняет размер гостевой сессии в cookie без записи в профиль", async () => {
  getUser.mockResolvedValue({ data: { user: null } });
  expect(await updateNewCardsLimit(100)).toEqual({ ok: true, limit: 50 });
  expect(setCookie).toHaveBeenCalledWith("guest_new_cards_limit", "50", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  expect(from).not.toHaveBeenCalled();
});
