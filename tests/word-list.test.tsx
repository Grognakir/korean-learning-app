import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DictionaryCacheProvider, useDictionaryCache } from "@/features/dictionary/DictionaryCacheContext";
import { WordList } from "@/features/dictionary/components/WordList";
import type { Word } from "@/features/dictionary/types";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient }));
vi.mock("@/features/dictionary/components/EditWordModal", () => ({ EditWordModal: () => null }));

afterEach(() => {
  vi.useRealTimers();
});

it("ищет переводы только с двух символов и фильтрует их по языку словаря", async () => {
  const tables: string[] = [];
  const translationSelects: string[] = [];
  const translationEq: [string, unknown][] = [];
  const words: Word[] = [{
    id: "1", headword: "학교", language: "ko", reading: null,
    part_of_speech: null, owner_user_id: null, translations: [{ text: "школа" }],
    word_categories: [], word_examples: [], word_notes: [], word_forms: [],
  }];
  createClient.mockImplementation(() => ({
    from: (table: string) => {
      tables.push(table);
      const query = {
        select: (cols?: string) => {
          if (table === "translations" && cols) translationSelects.push(cols);
          return query;
        },
        eq: (col: string, val: unknown) => {
          if (table === "translations") translationEq.push([col, val]);
          return query;
        },
        ilike: () => query,
        order: () => query,
        range: () => query,
        or: () => query,
        is: () => query,
        limit: () => query,
        then: (resolve: (value: unknown) => void) =>
          Promise.resolve({
            data: table === "translations" ? [] : words,
            count: table === "translations" ? 0 : words.length,
            error: null,
          }).then(resolve),
      };
      return query;
    },
  }));

  render(
    <DictionaryCacheProvider>
      <WordList categories={[]} userId={null} language="ko" onWordChanged={() => {}} />
    </DictionaryCacheProvider>,
  );
  await waitFor(() => expect(screen.getByText("학교")).toBeDefined());

  tables.length = 0;
  vi.useFakeTimers();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "а" } });
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
  vi.useRealTimers();
  await waitFor(() => expect(tables.length).toBeGreaterThan(0));
  expect(tables).not.toContain("translations");

  tables.length = 0;
  translationSelects.length = 0;
  translationEq.length = 0;
  vi.useFakeTimers();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "на" } });
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
  vi.useRealTimers();
  await waitFor(() => expect(tables).toContain("translations"));
  expect(translationSelects).toContain("word_id, words!inner(language)");
  expect(translationEq).toContainEqual(["words.language", "ko"]);
});

it("возвращается на доступную страницу после удаления её последнего слова", async () => {
  const words: Word[] = Array.from({ length: 11 }, (_, i) => ({
    id: String(i), headword: `word-${i + 1}`, language: "en", reading: null,
    part_of_speech: null, owner_user_id: null, translations: [],
    word_categories: [], word_examples: [], word_notes: [], word_forms: [],
  }));
  createClient.mockImplementation(() => ({ from: () => {
    let start = 0, end = 9;
    const query = {
      select: () => query, eq: () => query, order: () => query,
      range: (from: number, to: number) => { start = from; end = to; return query; },
      then: (resolve: (value: unknown) => void) => Promise.resolve({ data: words.slice(start, end + 1), count: words.length, error: null }).then(resolve),
    };
    return query;
  } }));
  function Harness() {
    const { clearResultsCache } = useDictionaryCache();
    return <>
      <button onClick={clearResultsCache}>Обновить данные</button>
      <WordList categories={[]} userId={null} language="en" onWordChanged={clearResultsCache} />
    </>;
  }
  render(<DictionaryCacheProvider><Harness /></DictionaryCacheProvider>);
  await waitFor(() => expect(screen.getByText("word-1")).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "2" }));
  await waitFor(() => expect(screen.getByText("word-11")).toBeDefined());
  words.pop();
  fireEvent.click(screen.getByRole("button", { name: "Обновить данные" }));
  await waitFor(() => expect(screen.getByText("word-1")).toBeDefined());
  expect(screen.getByRole("button", { name: "1" }).getAttribute("aria-current")).toBe("page");
  expect(screen.queryByText("word-11")).toBeNull();
});
