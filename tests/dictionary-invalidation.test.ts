import { beforeEach, expect, it, vi } from "vitest";
import { saveWord, updateWord, deleteWord } from "@/features/dictionary/actions";

const { createClient, revalidatePath } = vi.hoisted(() => ({ createClient: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/features/dictionary/ai", () => ({ generateWordDraft: vi.fn() }));
const draft = { headword: "school", translation: "школа", reading: null, partOfSpeech: null, notes: null, examples: [], categories: [] };
const rpc = vi.fn();
const wordId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => Promise.resolve({ data: [{ id: "word" }], error: null }).then(resolve),
  };
  rpc.mockResolvedValue({ error: null });
  createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "user" } } }) }, from: () => query, rpc });
});

it.each([
  ["добавления", () => saveWord(draft)],
  ["изменения", () => updateWord(wordId, draft)],
  ["удаления", () => deleteWord(wordId)],
] as const)("обновляет главную после %s слова", async (_label, action) => {
  expect(await action()).toEqual({ success: true });
  expect(revalidatePath).toHaveBeenCalledWith("/");
});

it("не обновляет показатели при неудачной записи", async () => {
  rpc.mockResolvedValue({ error: { message: "unavailable" } });
  expect(await saveWord(draft)).toHaveProperty("error");
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("не принимает идентификатор слова, который не UUID, и не обращается к базе", async () => {
  expect(await updateWord("word", draft)).toEqual({ error: "Слово не найдено" });
  expect(await deleteWord("word")).toEqual({ error: "Слово не найдено" });
  expect(createClient).not.toHaveBeenCalled();
});

it("показывает русское сообщение функции словаря, а остальные ошибки базы заменяет общим текстом", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  rpc.mockResolvedValue({ error: { code: "42501", message: "Слово не найдено" } });
  expect(await updateWord(wordId, draft)).toEqual({ error: "Слово не найдено" });
  rpc.mockResolvedValue({ error: { code: "23505", message: 'duplicate key value violates unique constraint "words_pkey"' } });
  expect(await saveWord(draft)).toEqual({ error: "Не удалось сохранить слово, попробуйте позже" });
  rpc.mockResolvedValue({ error: { code: "42501", message: 'new row violates row-level security policy for table "words"' } });
  expect(await saveWord(draft)).toEqual({ error: "Не удалось сохранить слово, попробуйте позже" });
});
