import inha2 from "./book-toc-inha-2.json";

export type BookTocGrammar = {
  label: string;
  /** Раздел урока (`toc_section`) и id блока — есть только у уже добавленных уроков. */
  section?: string;
  block?: string;
};

export type BookTocLesson = {
  lesson: number;
  unit: string;
  grammar: BookTocGrammar[];
};

export type BookToc = { title: string; lessons: BookTocLesson[] };

export const BOOK_TOCS: Record<string, BookToc> = {
  "inha-2": inha2,
};
