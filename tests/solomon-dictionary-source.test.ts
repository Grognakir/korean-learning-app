import { beforeEach, expect, it, vi } from "vitest";
import { loadLibrary } from "@/features/solomonOs/dictionary/loadLibrary";

const { from, requests, rows } = vi.hoisted(() => ({ from: vi.fn(), requests: [] as { table: string; calls: [string, unknown[]][] }[], rows: {} as Record<string, { data: unknown[]; count?: number; error?: { message: string } }> }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from }) }));
beforeEach(() => {
  requests.length = 0;
  Object.keys(rows).forEach((key) => delete rows[key]);
  from.mockImplementation((table: string) => {
    const request = { table, calls: [] as [string, unknown[]][] }; requests.push(request);
    const query: Record<string, unknown> = {};
    for (const method of ["select", "is", "order", "range", "eq", "ilike", "or", "limit"]) query[method] = (...args: unknown[]) => { request.calls.push([method, args]); return query; };
    query.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(rows[table] ?? { data: [], count: 0 }).then(resolve, reject);
    return query;
  });
});

it.each(["word", "phrase", "grammar"] as const)("читает %s только из общего словаря, с пагинацией", async (kind) => {
  const table = { word: "words", phrase: "phrases", grammar: "grammar_points" }[kind];
  rows[table] = { data: [], count: 42 };
  expect(await loadLibrary(kind, "", 2)).toEqual({ records: [], count: 42 });
  expect(requests[0]).toMatchObject({ table });
  expect(requests[0].calls).toContainEqual(["is", ["owner_user_id", null]]);
  expect(requests[0].calls).toContainEqual(["range", [20, 39]]);
});
it("читает конкретный источник по id, не ищет перевод и сохраняет полную грамматику", async () => {
  rows.grammar_points = { data: [{ id: "id", pattern: "N(이)라고 하다", short_desc: "называться", notes: [{ title: "Сноска", blocks: [{ type: "text", text: "Текст" }] }] }], count: 1 };
  const result = await loadLibrary("grammar", "ignored", 1, "id");
  expect(requests[0].calls).toContainEqual(["eq", ["id", "id"]]);
  expect(result.records[0].sections[0]).toEqual({ title: "Сноска", blocks: [{ type: "text", text: "Текст" }] });
  expect(requests).toHaveLength(1);
});
it("ищет слова по корейскому и переводу с экранированием, обрабатывает ошибки", async () => {
  rows.translations = { data: [{ word_id: "00000000-0000-0000-0000-000000000001" }] };
  await loadLibrary("word", "а,(б)%", 1);
  expect(requests.map((r) => r.table)).toEqual(["translations", "words"]);
  const filter = requests[1].calls.find(([method]) => method === "or")?.[1][0] as string;
  expect(filter).toContain('headword.ilike."');
  expect(filter).toContain('id.in.(00000000-0000-0000-0000-000000000001)');
  expect(filter).toContain('\\\\%');
  rows.phrases = { data: [], error: { message: "offline" } };
  await expect(loadLibrary("phrase", "привет", 1)).rejects.toMatchObject({ message: "offline" });
});
it.each(["word", "phrase", "grammar"] as const)("автозаполнение %s использует точное имя и только общий источник", async (kind) => {
  await loadLibrary(kind, "  사과  ", 1, undefined, true);
  expect(requests).toHaveLength(1);
  expect(requests[0].calls).toContainEqual(["is", ["owner_user_id", null]]);
  expect(requests[0].calls).toContainEqual(["eq", [{ word: "headword", phrase: "phrase_kr", grammar: "pattern" }[kind], "사과"]]);
  expect(requests[0].calls.some(([method]) => method === "ilike" || method === "or")).toBe(false);
});
