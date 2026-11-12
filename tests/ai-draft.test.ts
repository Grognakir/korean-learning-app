import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, generateWordDraft } = vi.hoisted(() => ({ createClient: vi.fn(), generateWordDraft: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/dictionary/ai", () => ({ generateWordDraft }));

import { generateWordDraftAction } from "@/features/dictionary/actions";

const rpc = vi.fn();
const getUser = vi.fn();
const from = vi.fn(() => ({ select: async () => ({ data: [{ name: "Еда" }] }) }));

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: 1, error: null });
  getUser.mockResolvedValue({ data: { user: { id: "user" } } });
  generateWordDraft.mockReset().mockResolvedValue({ headword: "사과" });
  createClient.mockResolvedValue({ auth: { getUser }, rpc, from });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("AI-черновик слова", () => {
  it("принимает ввод до 100 символов и возвращает черновик", async () => {
    expect(await generateWordDraftAction("사".repeat(100))).toEqual({ draft: { headword: "사과" } });
    expect(rpc).toHaveBeenCalledWith("bump_ai_draft_usage");
  });

  it("отклоняет пустой и слишком длинный ввод до обращения к базе и провайдеру", async () => {
    expect(await generateWordDraftAction("  ")).toEqual({ error: "Введите слово" });
    expect(await generateWordDraftAction("я".repeat(101))).toHaveProperty("error");
    expect(createClient).not.toHaveBeenCalled();
    expect(generateWordDraft).not.toHaveBeenCalled();
  });

  it("гостю отказывает, квоту не трогает", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await generateWordDraftAction("слово")).toEqual({ error: "Нужно войти" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("после 50 черновиков за сутки провайдера не вызывает", async () => {
    rpc.mockResolvedValue({ data: 50, error: null });
    expect(await generateWordDraftAction("слово")).toHaveProperty("draft");
    rpc.mockResolvedValue({ data: 51, error: null });
    const result = await generateWordDraftAction("слово");
    expect(result).toHaveProperty("error");
    expect(generateWordDraft).toHaveBeenCalledTimes(1);
  });

  it("при ошибке квоты возвращает общий текст и не обращается к провайдеру", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "secret db detail" } });
    expect(await generateWordDraftAction("слово")).toEqual({ error: "Не удалось получить черновик, попробуйте позже" });
    expect(generateWordDraft).not.toHaveBeenCalled();
  });

  it("сбой провайдера не раскрывает подробности, они уходят в журнал", async () => {
    generateWordDraft.mockRejectedValue(new Error("gemini HTTP 429 key=abc"));
    const result = await generateWordDraftAction("слово");
    expect(result).toEqual({ error: "Не удалось получить черновик, попробуйте позже" });
    expect(console.error).toHaveBeenCalledWith("generateWordDraft:", "gemini HTTP 429 key=abc");
  });
});
