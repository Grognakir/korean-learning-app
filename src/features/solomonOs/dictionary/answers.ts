import { shuffle } from "../wordTrainer/quiz";
import { koreanVariants, normalizeKorean, russianVariants, type DictionaryEntry } from "./entries";

export type CardMode = "ko-ru" | "ru-ko" | "typing";
export const questionText = (word: DictionaryEntry, mode: CardMode) => mode === "ko-ru" ? koreanVariants(word.ko)[0] : russianVariants(word.ru)[0];
export const answerText = (word: DictionaryEntry, mode: CardMode) => mode === "ko-ru" ? russianVariants(word.ru)[0] : koreanVariants(word.ko)[0];
const same = (a: string, b: string) => normalizeKorean(a) === normalizeKorean(b);
const answerVariants = (word: DictionaryEntry, mode: CardMode) => mode === "ko-ru" ? russianVariants(word.ru) : koreanVariants(word.ko);

// Записи с одинаковым вопросом (например, 공부하다 и 배우다 на «учиться») —
// одна группа: любая из них правильный ответ, поэтому ни в вариантах
// ответа, ни в проверке ввода они не должны отвергать друг друга.
export const questionGroup = (words: DictionaryEntry[], word: DictionaryEntry, mode: CardMode) =>
  words.filter((entry) => entry.id === word.id || same(questionText(entry, mode), questionText(word, mode)));

export const checkKoreanAnswer = (word: DictionaryEntry, input: string, group: DictionaryEntry[] = [word]) =>
  Boolean(normalizeKorean(input)) && group.some((entry) => koreanVariants(entry.ko).some((variant) => same(variant, input)));

function wrongChoices(words: DictionaryEntry[], word: DictionaryEntry, mode: CardMode) {
  const accepted = questionGroup(words, word, mode).flatMap((entry) => answerVariants(entry, mode));
  const candidates = words.filter((entry) => entry.id !== word.id).map((entry) => answerText(entry, mode));
  return [...new Set(candidates)].filter((answer) => !accepted.some((variant) => same(variant, answer)));
}
export const hasWrongChoice = (words: DictionaryEntry[], word: DictionaryEntry, mode: CardMode) => wrongChoices(words, word, mode).length > 0;

export function cardChoices(words: DictionaryEntry[], word: DictionaryEntry, mode: CardMode, random = Math.random) {
  return shuffle([answerText(word, mode), ...shuffle(wrongChoices(words, word, mode), random).slice(0, 3)], random);
}
