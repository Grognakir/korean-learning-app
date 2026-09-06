import { expect, it, vi } from "vitest";
import { createPageCache } from "@/features/dictionary/pageCache";
it("переиспользует фоновый запрос при открытии раздела", async () => {
 const cache = createPageCache();
 const run = vi.fn().mockResolvedValue({ data: ["word"], count: 1, error: null });
 await Promise.all([cache.request("words", run), cache.request("words", run)]);
 await cache.request("words", run);
 expect(run).toHaveBeenCalledTimes(1);
 expect(cache.get("words")?.rows).toEqual(["word"]);
});
it("не возвращает старые данные после сброса", async () => {
 const cache = createPageCache();
 let resolve!: (value: { data: string[]; count: number; error: null }) => void;
 const task = cache.request("words", () => new Promise((r) => { resolve = r; }));
 await Promise.resolve(); cache.clear();
 resolve({ data: ["old"], count: 1, error: null }); await task;
 expect(cache.get("words")).toBeUndefined();
});
it("после ошибки разрешает повторный запрос", async () => {
 const cache = createPageCache();
 const run = vi.fn().mockResolvedValueOnce({ data: null, count: null, error: { message: "offline" } }).mockResolvedValueOnce({ data: [], count: 0, error: null });
 await cache.request("words", run); await cache.request("words", run);
 expect(run).toHaveBeenCalledTimes(2);
});
