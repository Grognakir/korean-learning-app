// Ключи кэша первых страниц словаря. Списки и DictionaryPreload обязаны
// строить их одинаково, иначе предзагруженные данные не найдутся.
export type WordsKeyState = {
  debouncedQuery: string;
  sortDir: string;
  pageSize: number;
  page: number;
  partOfSpeech: string;
  categoryId: string;
  ownership: string;
  userId: string | null | undefined;
};

export const wordsPageKey = (state: WordsKeyState) =>
  JSON.stringify({
    debouncedQuery: state.debouncedQuery,
    sortDir: state.sortDir,
    pageSize: state.pageSize,
    page: state.page,
    partOfSpeech: state.partOfSpeech,
    categoryId: state.categoryId,
    ownership: state.ownership,
    userId: state.userId,
  });

export const firstWordsPageKey = (userId: string | null) =>
  wordsPageKey({ debouncedQuery: "", sortDir: "asc", pageSize: 10, page: 1, partOfSpeech: "", categoryId: "", ownership: "all", userId });

export const listPageKey = (section: "phrases" | "grammar", debouncedQuery: string, category: string, page: number) =>
  JSON.stringify({ section, debouncedQuery, category, page });
