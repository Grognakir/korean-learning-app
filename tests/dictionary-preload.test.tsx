import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { DictionaryCacheProvider, useDictionaryPageCache } from "@/features/dictionary/DictionaryCacheContext";
import { DictionaryPreload } from "@/features/dictionary/DictionaryPreload";
import { usePagedQuery } from "@/features/dictionary/usePagedQuery";
import type { PageResult } from "@/features/dictionary/pageCache";

const { from, router } = vi.hoisted(() => ({ from: vi.fn(), router: { prefetch: vi.fn() } }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from }) }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const requests: { table: string; resolve: (result: PageResult) => void; reject: (error: Error) => void }[] = [];
const wordsKey = JSON.stringify({ debouncedQuery: "", sortDir: "asc", pageSize: 10, page: 1, partOfSpeech: "", categoryId: "", ownership: "all", userId: null, language: "ko" });
const foreground = vi.fn().mockResolvedValue({ data: ["unexpected"], count: 1, error: null });

function Section({ cacheKey }: { cacheKey: string }) {
  const cache = useDictionaryPageCache<string>();
  const result = usePagedQuery<string>({ cacheKey, label: "test", run: foreground, cache });
  return <div>{result.loading ? "loading" : result.rows.join(",")}</div>;
}

beforeEach(() => {
  requests.length = 0;
  from.mockReset();
  router.prefetch.mockClear();
  foreground.mockClear();
  from.mockImplementation((table: string) => {
    const promise = new Promise<PageResult>((resolve, reject) => requests.push({ table, resolve, reject }));
    const query = { select: () => query, eq: () => query, order: () => query, range: () => query, is: () => query, then: promise.then.bind(promise) };
    return query;
  });
});

async function complete(index: number, row: string) {
  await act(async () => requests[index].resolve({ data: [row], count: 1, error: null }));
}

it("загружает разделы по очереди и отдаёт их первому открытию из общего кэша", async () => {
  const view = (cacheKey?: string) => <DictionaryCacheProvider><DictionaryPreload userId={null} language="ko" />{cacheKey && <Section cacheKey={cacheKey} />}</DictionaryCacheProvider>;
  const { rerender } = render(view());
  await waitFor(() => expect(requests.map(r => r.table)).toEqual(["words"]));
  rerender(view(wordsKey));
  await act(async () => {});
  expect(foreground).not.toHaveBeenCalled();
  await complete(0, "word");
  expect(screen.getByText("word")).toBeTruthy();
  expect(requests.map(r => r.table)).toEqual(["words", "phrases"]);
  await complete(1, "phrase");
  expect(requests.map(r => r.table)).toEqual(["words", "phrases", "grammar_points"]);
  await complete(2, "grammar");
  expect(router.prefetch).toHaveBeenCalledWith("/dictionary");
  rerender(view(JSON.stringify({ section: "phrases", debouncedQuery: "", category: "", page: 1 })));
  expect(screen.getByText("phrase")).toBeTruthy();
  rerender(view(JSON.stringify({ section: "grammar", debouncedQuery: "", category: "", page: 1 })));
  expect(screen.getByText("grammar")).toBeTruthy();
  expect(foreground).not.toHaveBeenCalled();
  expect(from).toHaveBeenCalledTimes(3);
});

it("продолжает цепочку после сетевой ошибки", async () => {
  render(<DictionaryCacheProvider><DictionaryPreload userId={null} language="ko" /></DictionaryCacheProvider>);
  await waitFor(() => expect(requests).toHaveLength(1));
  await act(async () => requests[0].reject(new Error("offline")));
  expect(requests[1].table).toBe("phrases");
  await complete(1, "phrase");
  await complete(2, "grammar");
  expect(router.prefetch).toHaveBeenCalledWith("/dictionary");
});

it("в английском режиме загружает только слова", async () => {
  render(<DictionaryCacheProvider><DictionaryPreload userId={null} language="en" /></DictionaryCacheProvider>);
  await waitFor(() => expect(requests).toHaveLength(1));
  await complete(0, "word");
  expect(from).toHaveBeenCalledTimes(1);
  expect(router.prefetch).toHaveBeenCalledWith("/dictionary");
});

it("после ухода не запускает следующие разделы старой цепочки", async () => {
  const { unmount } = render(<DictionaryCacheProvider><DictionaryPreload userId={null} language="ko" /></DictionaryCacheProvider>);
  await waitFor(() => expect(requests).toHaveLength(1));
  unmount();
  await complete(0, "word");
  expect(from).toHaveBeenCalledTimes(1);
  expect(router.prefetch).not.toHaveBeenCalled();
});
