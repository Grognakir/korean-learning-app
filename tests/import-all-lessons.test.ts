// @vitest-environment node
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { importAllLocalLessons } from "../scripts/lib/import-lessons";

const url = "http://127.0.0.1:54331";
type Row = { id: string; page_index: number; page_number: number | null; content: unknown };
let directory: string, sources: string, backup: string;
let database: Record<number, Row[]>;
let calls: { method: string; url: URL; body: unknown }[];
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "import-all-lessons-")); sources = join(directory, "lessons"); backup = join(directory, "backup");
  calls = []; database = {};
  for (const number of [1, 2]) {
    const folder = join(sources, `lesson_${number}`); mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, `lesson-0${number}.json`), JSON.stringify({ textbook_id: "inha_book_2", lesson_number: number, title: `Урок ${number}`, pages: [
      { page_number: null, page_role: "lesson_opening", source_photo: "opening", blocks: [{ type: "lesson_toc", sections: [] }] },
      { page_number: 10 * number, page_role: "content", source_photo: `photo-${number}`, blocks: [{ type: "text", id: `text-${number}` }] },
    ] }));
    database[number] = [{ id: `old-${number}-opening`, page_index: number * 10, page_number: null, content: { blocks: [] } }, { id: `old-${number}-content`, page_index: number * 10 + 1, page_number: number * 10, content: { blocks: [] } }];
  }
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => { rmSync(directory, { recursive: true, force: true }); vi.restoreAllMocks(); });
function client() {
  return createClient(url, "test-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (input, init) => {
    const request = new Request(input, init), requestUrl = new URL(request.url);
    const body = request.method === "GET" ? null : await request.json();
    calls.push({ method: request.method, url: requestUrl, body });
    let data: unknown = null;
    if (requestUrl.pathname.endsWith("/textbooks")) data = { id: "textbook" };
    if (requestUrl.pathname.endsWith("/lessons") && request.method === "GET") data = [{ textbook_id: "textbook", lesson_number: 1, title: "Старое название" }];
    if (requestUrl.pathname.endsWith("/textbook_pages")) {
      if (request.method === "GET") data = database[Number(requestUrl.searchParams.get("lesson_number")?.replace("eq.", ""))];
      else for (const row of body) {
        expect(existsSync(backup)).toBe(true);
        database[row.lesson_number] = body.map(({ id, page_index, page_number, content }: Row) => ({ id, page_index, page_number, content }));
      }
    }
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } } });
}
it("проверяет все уроки до записи, делает резервную копию и сохраняет id/индексы", async () => {
  const original = structuredClone(database);
  const result = await importAllLocalLessons(client(), url, sources, { backupDir: backup });
  expect(result).toMatchObject({ lessons: 2, pages: 4, changed: 4 });
  const snapshot = JSON.parse(readFileSync(result.backupPath!, "utf8"));
  expect(snapshot.pages.map((row: Row) => row.id)).toEqual(Object.values(original).flat().map((row) => row.id));
  expect(snapshot.lessons[0].title).toBe("Старое название");
  expect(Object.values(database).flat().map((row) => [row.id, row.page_index])).toEqual(Object.values(original).flat().map((row) => [row.id, row.page_index]));
  const firstWrite = calls.findIndex((call) => call.method !== "GET");
  expect(calls.slice(0, firstWrite).filter((call) => call.url.pathname.endsWith("/textbook_pages"))).toHaveLength(2);
  expect(database[2][1].content).toMatchObject({ blocks: [{ type: "text", id: "text-2" }] });
});
it("dry-run не пишет ни базу, ни резервную копию", async () => {
  const before = structuredClone(database);
  await importAllLocalLessons(client(), url, sources, { dryRun: true });
  expect(calls.every((call) => call.method === "GET")).toBe(true);
  expect(database).toEqual(before); expect(existsSync(backup)).toBe(false);
});
it("ошибка в последнем уроке останавливает весь импорт до первой записи", async () => {
  database[2].pop();
  await expect(importAllLocalLessons(client(), url, sources, { backupDir: backup })).rejects.toThrow("Число страниц изменилось");
  expect(calls.every((call) => call.method === "GET")).toBe(true);
  expect(existsSync(backup)).toBe(false);
});
it("без папки бэкапа и при удалённой базе не выполняет запросы", async () => {
  await expect(importAllLocalLessons(client(), url, sources)).rejects.toThrow("backup-dir");
  await expect(importAllLocalLessons(client(), "https://remote.supabase.co", sources, { backupDir: backup })).rejects.toThrow("локальную базу");
  expect(calls).toHaveLength(0);
});
