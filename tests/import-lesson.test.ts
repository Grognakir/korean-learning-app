// @vitest-environment node
import { createClient } from "@supabase/supabase-js";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { importLessonJson } from "../scripts/lib/import-lesson";

const localUrl = "http://127.0.0.1:54331";
const source = {
  textbook_id: "inha_book_2",
  lesson_number: 12,
  title: "다툼과 화해",
  pages: [
    { page_number: null, page_role: "lesson_opening", source_photo: "IMG_1430", blocks: [{ type: "lesson_toc", sections: [] }] },
    { page_number: 192, page_role: "content", source_photo: "IMG_1431", blocks: [{ type: "text", text: "Обновлённый текст" }] },
  ],
};

let dir: string;
let file: string;
let existing: { id: string; page_index: number; page_number: number | null; content: unknown }[];
let calls: { url: URL; method: string; body: unknown }[];
let persist: boolean;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "import-lesson-"));
  file = join(dir, "lesson-12.json");
  writeFileSync(file, JSON.stringify(source));
  existing = source.pages.map((page, index) => ({
    id: `page-${index}`, page_index: 165 + index * 2,
    page_number: page.page_number, content: { blocks: [] },
  }));
  calls = [];
  persist = true;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function client() {
  return createClient(localUrl, "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const body = request.method === "GET" ? null : await request.json();
        calls.push({ url, method: request.method, body });
        let data: unknown = null;
        if (url.pathname.endsWith("/textbooks")) data = { id: "textbook-2" };
        if (url.pathname.endsWith("/textbook_pages")) {
          if (request.method === "POST" && persist) {
            existing = body.map(({ id, page_index, page_number, content }: typeof existing[number]) => ({
              id, page_index, page_number, content,
            }));
          }
          if (request.method === "GET") data = existing;
        }
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
      },
    },
  });
}

it("обновляет только выбранный урок и сохраняет существующие id и сквозные индексы", async () => {
  await importLessonJson(client(), localUrl, file);
  expect(calls[0].url.searchParams.get("slug")).toBe("eq.inha-2");
  const reads = calls.filter((call) => call.method === "GET" && call.url.pathname.endsWith("/textbook_pages"));
  expect(reads).toHaveLength(2);
  for (const { url } of reads) {
    expect(url.searchParams.get("textbook_id")).toBe("eq.textbook-2");
    expect(url.searchParams.get("lesson_number")).toBe("eq.12");
    expect(url.searchParams.get("order")).toBe("page_index.asc");
  }
  expect(existing.map((page) => [page.id, page.page_index])).toEqual([["page-0", 165], ["page-1", 167]]);
  expect(existing[1].content).toEqual({
    page_role: source.pages[1].page_role, source_photo: "IMG_1431", blocks: source.pages[1].blocks,
  });
  expect(calls.find((call) => call.url.pathname.endsWith("/lessons"))?.body).toEqual({
    textbook_id: "textbook-2", lesson_number: 12, title: source.title,
  });
});

it("поддерживает первый уровень и dry-run без записи", async () => {
  writeFileSync(file, JSON.stringify({ ...source, textbook_id: "inha_book_1" }));
  await importLessonJson(client(), localUrl, file, true);
  expect(calls[0].url.searchParams.get("slug")).toBe("eq.inha-1");
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("отклоняет удалённую базу до запросов", async () => {
  await expect(importLessonJson(client(), "https://example.supabase.co", file)).rejects.toThrow("только в локальную базу");
  expect(calls).toHaveLength(0);
});

it("не записывает данные при изменении числа страниц", async () => {
  existing.pop();
  await expect(importLessonJson(client(), localUrl, file)).rejects.toThrow("Число страниц изменилось");
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("не создаёт урок с индексами, способными перезаписать соседний урок", async () => {
  existing = [];
  await expect(importLessonJson(client(), localUrl, file)).rejects.toThrow("ещё не импортирован");
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("проверяет структуру JSON до запросов", async () => {
  writeFileSync(file, JSON.stringify({ ...source, pages: [{ blocks: null }] }));
  await expect(importLessonJson(client(), localUrl, file)).rejects.toThrow();
  expect(calls).toHaveLength(0);
});

it("сообщает о несовпадении данных при обратном чтении", async () => {
  persist = false;
  await expect(importLessonJson(client(), localUrl, file)).rejects.toThrow("после импорта не совпали");
});
