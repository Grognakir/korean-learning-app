import { shuffle } from "../wordTrainer/quiz";
import { koreanVariants, normalizeKorean, russianVariants, type DictionaryEntry } from "./entries";

export type CardMode = "ko-ru" | "ru-ko" | "typing";
export const questionText = (word: DictionaryEntry, mode: CardMode) => mode === "ko-ru" ? koreanVariants(word.ko)[0] : russianVariants(word.ru)[0];
export const answerText = (word: DictionaryEntry, mode: CardMode) => mode === "ko-ru" ? russianVariants(word.ru)[0] : koreanVariants(word.ko)[0];
export const checkKoreanAnswer = (word: DictionaryEntry, input: string) => Boolean(normalizeKorean(input)) && koreanVariants(word.ko).some((variant) => normalizeKorean(variant) === normalizeKorean(input));
export function cardChoices(words: DictionaryEntry[], word: DictionaryEntry, mode: CardMode, random = Math.random) {
  const correct = answerText(word, mode);
  const others = [...new Set(words.filter((entry) => entry.id !== word.id).map((entry) => answerText(entry, mode)))].filter((answer) => answer !== correct);
  return shuffle([correct, ...shuffle(others, random).slice(0, 3)], random);
}
