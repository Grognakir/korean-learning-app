import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { DRAFT_DEADLINE_MS, generateWordDraft } from "@/features/dictionary/ai";

const draftJson = JSON.stringify({ category: "Еда", newCategory: false, partOfSpeech: "noun", kr: "사과", reading: "sagwa", translation: "яблоко", notes: "", examples: [{ kr: "사과를 먹어요.", ru: "Ем яблоко." }] });

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "g");
  vi.stubEnv("GROQ_API_KEY", "q");
  vi.stubEnv("OPENROUTER_API_KEY", "o");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers(); });

it("системный текст Gemini уходит в systemInstruction, а запросы имеют общий срок", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: draftJson }] } }] }) });
  vi.stubGlobal("fetch", fetchMock);
  await generateWordDraft("яблоко", ["Еда"]);
  const [, init] = fetchMock.mock.calls[0];
  const body = JSON.parse(init.body);
  expect(body.systemInstruction.parts[0].text).toContain("Еда");
  expect(body.contents[0].parts[0].text).toBe("Слово или значение: яблоко");
  expect(init.signal).toBeInstanceOf(AbortSignal);
});

it("после общего срока следующий провайдер не вызывается", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn((_url: string, init: RequestInit) => new Promise((_, reject) => {
    init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "TimeoutError")));
  }));
  vi.stubGlobal("fetch", fetchMock);
  const promise = generateWordDraft("яблоко", ["Еда"]);
  const assertion = expect(promise).rejects.toThrow("Все провайдеры недоступны");
  await vi.advanceTimersByTimeAsync(DRAFT_DEADLINE_MS + 1);
  await assertion;
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("при быстрой ошибке первого провайдера пробует следующий", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: false, status: 500 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: draftJson } }] }) });
  vi.stubGlobal("fetch", fetchMock);
  const draft = await generateWordDraft("яблоко", ["Еда"]);
  expect(draft.headword).toBe("사과");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
