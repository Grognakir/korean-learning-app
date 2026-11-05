import { shuffle } from "../wordTrainer/quiz";
import { trainableWords, type DictionaryData, type DictionaryEntry } from "./entries";
import { answerText, cardChoices, checkKoreanAnswer, type CardMode } from "./answers";

export type CardScope = "all" | "hard";
export type CardSession = {
  mode: CardMode; words: DictionaryEntry[]; pool: DictionaryEntry[]; position: number;
  correct: number; answered: number; errors: string[]; phase: "question" | "feedback" | "done";
  choices: string[]; input: string; right?: boolean;
};
export function scopedWords(data: DictionaryData, scope: CardScope) {
  return trainableWords(data).filter((word) => scope !== "hard" || word.fail > word.ok);
}
export const minimumWords = (mode: CardMode) => mode === "typing" ? 1 : 2;
export function startCards(words: DictionaryEntry[], mode: CardMode, random = Math.random, pool = words): CardSession | null {
  if (!words.length || pool.length < minimumWords(mode)) return null;
  const ordered = shuffle(words.map((word) => ({ ...word })), random);
  const copiedPool = pool.map((word) => ({ ...word }));
  return { mode, words: ordered, pool: copiedPool, position: 0, correct: 0, answered: 0, errors: [], phase: "question", choices: cardChoices(copiedPool, ordered[0], mode, random), input: "" };
}
export function answerCard(session: CardSession, input: string): CardSession {
  if (session.phase !== "question" || !input.trim() || session.mode !== "typing" && !session.choices.includes(input)) return session;
  const word = session.words[session.position];
  const right = session.mode === "typing" ? checkKoreanAnswer(word, input) : input === answerText(word, session.mode);
  return { ...session, phase: "feedback", input, right, answered: session.answered + 1, correct: session.correct + Number(right), errors: right ? session.errors : [...session.errors, word.id] };
}
export function nextCard(session: CardSession, random = Math.random): CardSession {
  if (session.phase !== "feedback") return session;
  const position = session.position + 1;
  return position === session.words.length ? { ...session, phase: "done" }
    : { ...session, position, phase: "question", input: "", right: undefined, choices: cardChoices(session.pool, session.words[position], session.mode, random) };
}
export function repeatCards(session: CardSession, errorsOnly: boolean, random = Math.random) {
  const words = errorsOnly ? session.words.filter((word) => session.errors.includes(word.id)) : session.words;
  return startCards(words, session.mode, random, session.pool);
}
export const stopCards = (session: CardSession): CardSession => ({ ...session, phase: "done" });
