import { expect, it, vi } from "vitest";
import { wordsSource } from "@/features/dictionary/wordSearch";

function fakeClient() {
  const builder = { select: vi.fn(), ilike: vi.fn() };
  builder.select.mockReturnValue(builder);
  builder.ilike.mockReturnValue(builder);
  const client = { rpc: vi.fn(() => builder), from: vi.fn(() => builder) };
  return { client, builder };
}

it("поиск от двух символов идёт через search_words, count — третьим аргументом rpc", () => {
  const { client, builder } = fakeClient();
  wordsSource(client as never, "id, headword", " на ");
  expect(client.rpc).toHaveBeenCalledWith("search_words", { q: "на" }, { count: "exact", get: true });
  expect(builder.select).toHaveBeenCalledWith("id, headword");
  expect(client.from).not.toHaveBeenCalled();
});

it("один символ ищет только по написанию, спецсимволы LIKE экранируются", () => {
  const { client, builder } = fakeClient();
  wordsSource(client as never, "id", "_");
  expect(client.rpc).not.toHaveBeenCalled();
  expect(builder.select).toHaveBeenCalledWith("id", { count: "exact" });
  expect(builder.ilike).toHaveBeenCalledWith("headword", "%\\_%");
});

it("пустой запрос читает таблицу без фильтра", () => {
  const { client, builder } = fakeClient();
  wordsSource(client as never, "id", "  ");
  expect(client.from).toHaveBeenCalledWith("words");
  expect(builder.ilike).not.toHaveBeenCalled();
});
