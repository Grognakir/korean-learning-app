import { BOOK_TOCS } from "./data/bookToc";

// Канон «что вообще существует» берётся из оглавления учебника и общего
// набора разделов урока, а не из содержимого БД: у ещё не импортированного
// урока в базе нет ничего, но «скоро появится» для него верно, а для
// выдуманного адреса — нет, там должен быть 404.
export const LESSON_SECTION_KEYS = [
  "준비하기 1",
  "준비하기 2",
  "말하기",
  "듣고 말하기",
  "읽고 말하기",
  "쓰기",
  "문화 이해하기",
] as const;

export const isKnownTextbook = (slug: string) => Object.hasOwn(BOOK_TOCS, slug);

export const isKnownLesson = (slug: string, lessonNumber: number) =>
  isKnownTextbook(slug) && BOOK_TOCS[slug].lessons.some((lesson) => lesson.lesson === lessonNumber);

export const isKnownSection = (sectionKey: string) =>
  (LESSON_SECTION_KEYS as readonly string[]).includes(sectionKey);

export function decodeSectionKey(param: string): string | null {
  try {
    return decodeURIComponent(param);
  } catch {
    return null;
  }
}
