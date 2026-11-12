import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordReview, updateNewCardsLimit } from "@/features/trainers/flashcards/actions";
import { applySrs, INTERVAL_LADDER, type SrsRating } from "@/features/trainers/flashcards/srs";

const { createClient, revalidatePath, setCookie } = vi.hoisted(() => ({
  createClient: vi.fn(), revalidatePath: vi.fn(), setCookie: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: setCookie }) }));
vi.mock("next/cache", () => ({ revalidatePath }));

const wordId = "11111111-1111-4111-8111-111111111111";
const updateQuery = { eq: vi.fn(), select: vi.fn() };
const query = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};
const getUser = vi.fn();
const from = vi.fn(() => query);

beforeEach(() => {
  getUser.mockResolvedValue({ data: { user: { id: "user" } } });
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  query.insert.mockResolvedValue({ error: null });
  query.update.mockReset().mockReturnValue(updateQuery);
  updateQuery.eq.mockReset().mockReturnValue(updateQuery);
  updateQuery.select.mockReset().mockResolvedValue({ data: [{ id: "row" }], error: null });
  createClient.mockResolvedValue({ auth: { getUser }, from });
});

describe("сохранение прогресса", () => {
  it("не перезаписывает прогресс, когда не удалось прочитать прежнее состояние", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: { message: "Database unavailable" } });
    expect(await recordReview(wordId, "good")).toEqual({ error: "Database unavailable" });
    expect(query.insert).not.toHaveBeenCalled();
    expect(query.update).not.toHaveBeenCalled();
  });

  it("отклоняет неизвестную оценку до обращения к базе", async () => {
    expect(await recordReview(wordId, "invalid" as SrsRating)).toHaveProperty("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("отклоняет некорректный идентификатор слова", async () => {
    expect(await recordReview("invalid", "good")).toHaveProperty("error");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("новое слово: «Хорошо» даёт первую ступень лесенки", async () => {
    expect(await recordReview(wordId, "good")).toEqual({ ok: true });
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user", word_id: wordId, repetitions: 1, interval_days: 1, last_rating: "good",
    }));
  });

  it("существующее слово: идёт на следующую ступень и обновляет строку по версии", async () => {
    query.maybeSingle.mockResolvedValue({ data: { interval_days: 6, repetitions: 4, version: 3 }, error: null });
    expect(await recordReview(wordId, "good")).toEqual({ ok: true });
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
      repetitions: 5, interval_days: 8, last_rating: "good", version: 4,
    }));
    expect(updateQuery.eq).toHaveBeenCalledWith("version", 3);
  });

  it("при потерянной версии перечитывает состояние и считает от него", async () => {
    query.maybeSingle
      .mockResolvedValueOnce({ data: { interval_days: 2, repetitions: 2, version: 1 }, error: null })
      .mockResolvedValueOnce({ data: { interval_days: 4, repetitions: 3, version: 2 }, error: null });
    updateQuery.select
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [{ id: "row" }], error: null });
    expect(await recordReview(wordId, "good")).toEqual({ ok: true });
    expect(query.update).toHaveBeenLastCalledWith(expect.objectContaining({ interval_days: 6, version: 3 }));
  });

  it("возвращает ошибку, если версию не удалось зафиксировать за три попытки", async () => {
    query.maybeSingle.mockResolvedValue({ data: { interval_days: 2, repetitions: 2, version: 1 }, error: null });
    updateQuery.select.mockResolvedValue({ data: [], error: null });
    expect(await recordReview(wordId, "good")).toHaveProperty("error");
    expect(query.update).toHaveBeenCalledTimes(3);
  });

  it("при гонке создания строки повторяет по ветке обновления", async () => {
    query.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { interval_days: 1, repetitions: 1, version: 0 }, error: null });
    query.insert.mockResolvedValueOnce({ error: { code: "23505", message: "dup" } });
    expect(await recordReview(wordId, "good")).toEqual({ ok: true });
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ interval_days: 2, version: 1 }));
  });

  it("не повторяет запись при другой ошибке вставки", async () => {
    query.insert.mockResolvedValue({ error: { code: "42501", message: "denied" } });
    expect(await recordReview(wordId, "good")).toEqual({ error: "denied" });
    expect(query.insert).toHaveBeenCalledTimes(1);
  });

  it("не вызывает revalidatePath", async () => {
    await recordReview(wordId, "good");
    expect(revalidatePath).not.toHaveBeenCalled();
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

describe("лесенка интервалов", () => {
  const now = new Date("2026-11-12T00:00:00Z");
  const run = (intervalDays: number, rating: SrsRating) => applySrs({ intervalDays, repetitions: 1 }, rating, now).intervalDays;

  it("правильные ответы идут по лесенке 1 → 2 → 4 → 6 → 8 → 12 → 16 → 20 → 24 → 32 → 48", () => {
    const seen: number[] = [];
    let interval = 0;
    for (let i = 0; i < INTERVAL_LADDER.length; i++) {
      interval = run(interval, "good");
      seen.push(interval);
    }
    expect(seen).toEqual([1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 48]);
    expect(run(48, "easy")).toBe(48);
  });

  it.each(["again", "hard"] as const)("%s на любой ступени возвращает к 1 дню и обнуляет повторения", (rating) => {
    for (const step of INTERVAL_LADDER) {
      const result = applySrs({ intervalDays: step, repetitions: 5 }, rating, now);
      expect(result.intervalDays).toBe(1);
      expect(result.repetitions).toBe(0);
    }
  });

  it("слова со старыми интервалами SM-2 переходят на ближайшую большую ступень", () => {
    expect(run(15, "good")).toBe(16);
    expect(run(38, "good")).toBe(48);
  });

  it("срок повторения считается от интервала", () => {
    expect(applySrs({ intervalDays: 4, repetitions: 2 }, "good", now).dueAt.toISOString()).toBe("2026-11-18T00:00:00.000Z");
  });
});

it("сохраняет размер гостевой сессии в cookie без записи в профиль", async () => {
  getUser.mockResolvedValue({ data: { user: null } });
  expect(await updateNewCardsLimit(100)).toEqual({ ok: true, limit: 50 });
  expect(setCookie).toHaveBeenCalledWith("guest_new_cards_limit", "50", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  expect(from).not.toHaveBeenCalled();
});
