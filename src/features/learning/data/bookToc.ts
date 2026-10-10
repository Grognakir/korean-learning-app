import inha2 from "./book-toc-inha-2.json";

export type BookTocPart = { topic: string; grammar: string[] };

export type BookTocLesson = {
  lesson: number;
  unit: string;
  prep1: BookTocPart;
  prep2: BookTocPart;
  speaking: string;
  listening: string;
  reading: string;
  writing: string;
  culture: string;
  pronunciation: string[];
};

export type BookToc = { title: string; lessons: BookTocLesson[] };

export const BOOK_TOCS: Record<string, BookToc> = {
  "inha-2": inha2,
};
