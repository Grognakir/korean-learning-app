import { beforeEach, expect, it, vi } from "vitest";
import { saveWord, updateWord, deleteWord } from "@/features/dictionary/actions";

const { createClient, revalidatePath } = vi.hoisted(() => ({ createClient: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/features/dictionary/ai", () => ({ generateWordDraft: vi.fn() }));
const draft = { headword: "school", translation: "школа", reading: null, partOfSpeech: null, notes: null, examples: [], categories: [] };
const rpc = vi.fn();

beforeEach(() => {
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
    single: async () => ({ data: { active_language: "en" } }),
    then: (resolve: (value: unknown) => void) => Promise.resolve({ data: [{ id: "word" }], error: null }).then(resolve),
  };
  rpc.mockResolvedValue({ error: null });
  createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "user" } } }) }, from: () => query, rpc });
});

it.each([
  ["добавления", () => saveWord(draft)],
  ["изменения", () => updateWord("word", draft)],
  ["удаления", () => deleteWord("word")],
] as const)("обновляет главную после %s слова", async (_label, action) => {
  expect(await action()).toEqual({ success: true });
  expect(revalidatePath).toHaveBeenCalledWith("/");
});

it("не обновляет показатели при неудачной записи", async () => {
  rpc.mockResolvedValue({ error: { message: "unavailable" } });
  expect(await saveWord(draft)).toHaveProperty("error");
  expect(revalidatePath).not.toHaveBeenCalled();
});
