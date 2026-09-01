import type { PartOfSpeech } from "./types";

export const PART_OF_SPEECH_LABELS: Record<PartOfSpeech, string> = {
  noun: "Существительное",
  verb: "Глагол",
  adjective: "Прилагательное",
  adverb: "Наречие",
  pronoun: "Местоимение",
  numeral: "Числительное",
  counter: "Счётное слово",
  particle: "Частица",
  preposition: "Предлог",
  conjunction: "Союз",
  connective_ending: "Соединительное окончание",
  question_word: "Вопросительное слово",
  determiner: "Определитель",
  interjection: "Междометие",
};

const GRAMMAR_TAGS = new Set<PartOfSpeech>([
  "pronoun",
  "numeral",
  "counter",
  "particle",
  "preposition",
  "conjunction",
  "connective_ending",
  "question_word",
  "determiner",
]);

export function partOfSpeechLabel(tag: string | null | undefined): string | null {
  if (!tag) return null;
  return PART_OF_SPEECH_LABELS[tag as PartOfSpeech] ?? tag;
}

export function partOfSpeechVariant(
  tag: string | null | undefined,
): "content" | "grammar" | null {
  if (!tag) return null;
  return GRAMMAR_TAGS.has(tag as PartOfSpeech) ? "grammar" : "content";
}
