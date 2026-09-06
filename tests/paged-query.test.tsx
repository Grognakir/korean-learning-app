import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { usePagedQuery, type PagedEntry } from "@/features/dictionary/usePagedQuery";

it("не показывает старые строки после сброса кэша", async () => {
  const entries = new Map<string, PagedEntry<string>>();
  const get = (key: string) => entries.get(key);
  const set = (key: string, entry: PagedEntry<string>) => { entries.set(key, entry); };
  let resolve!: (value: { data: string[]; count: number; error: null }) => void;
  const run = vi.fn().mockResolvedValueOnce({ data: ["old"], count: 1, error: null })
    .mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
  const { result, rerender } = renderHook(({ generation }) => usePagedQuery<string>({
    cacheKey: "words", label: "test", run, cache: { get, set, generation },
  }), { initialProps: { generation: 0 } });
  await waitFor(() => expect(result.current.rows).toEqual(["old"]));
  entries.clear();
  rerender({ generation: 1 });
  expect(result.current.loading).toBe(true);
  expect(result.current.rows).toEqual([]);
  await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
  await act(async () => resolve({ data: ["new"], count: 1, error: null }));
  expect(result.current.rows).toEqual(["new"]);
});

it("игнорирует поздний ответ от предыдущего поиска", async () => {
  let resolveOld!: (value: { data: string[]; count: number; error: null }) => void;
  const oldRun = () => new Promise<{ data: string[]; count: number; error: null }>((r) => { resolveOld = r; });
  const newRun = () => Promise.resolve({ data: ["new"], count: 1, error: null });
  const { result, rerender } = renderHook(({ key, run }) => usePagedQuery<string>({ cacheKey: key, label: "test", run }),
    { initialProps: { key: "old", run: oldRun } });
  rerender({ key: "new", run: newRun });
  await waitFor(() => expect(result.current.rows).toEqual(["new"]));
  await act(async () => resolveOld({ data: ["old"], count: 1, error: null }));
  expect(result.current.rows).toEqual(["new"]);
});
