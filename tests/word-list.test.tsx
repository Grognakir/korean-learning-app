import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DictionaryCacheProvider, useDictionaryCache } from "@/features/dictionary/DictionaryCacheContext";
import { WordList } from "@/features/dictionary/components/WordList";
import type { Word } from "@/features/dictionary/types";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient }));
vi.mock("@/features/dictionary/components/EditWordModal", () => ({ EditWordModal: () => null }));

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
