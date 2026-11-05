import type { Word, WordTopic } from "./topics";

export function normalizeAnswer(input: string): string {
  return input.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/(?<![\p{L}\p{N}])-|-(?![\p{L}\p{N}])/gu, " ").trim().replace(/\s+/g, " ");
}
function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) next.push(Math.min(next[j] + 1, row[j + 1] + 1, row[j] + Number(a[i] !== b[j])));
    row = next;
  }
  return row[b.length];
}
export function checkAnswer(word: Word, input: string): "exact" | "typo" | "wrong" {
  const answer = normalizeAnswer(input);
  if (!answer) return "wrong";
  const accepted = [word.ru, ...word.accept].map(normalizeAnswer);
  if (accepted.includes(answer)) return "exact";
  return answer.length >= 5 && accepted.some((value) => distance(answer, value) === 1) ? "typo" : "wrong";
}
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function buildQueue(topic: WordTopic, random = Math.random): string[] {
  return shuffle(topic.words.map((w) => w.id), random);
}
export function deferMistakes(pending: string[], mistakes: string[], failedId?: string, random = Math.random): string[] {
  const missed = new Set(mistakes);
  const fresh = pending.filter((id) => !missed.has(id));
  const retry = shuffle([...new Set([...pending.filter((id) => missed.has(id)), ...(failedId ? [failedId] : [])])], random);
  if (retry.length > 1 && retry[0] === failedId) [retry[0], retry[1]] = [retry[1], retry[0]];
  return [...fresh, ...retry];
}
export function buildChoices(topic: WordTopic, word: Word, random = Math.random): string[] {
  const other = [...new Set(topic.words.filter((w) => w.group === word.group && w.ru !== word.ru).map((w) => w.ru))];
  return shuffle([word.ru, ...shuffle(other, random).slice(0, 3)], random);
}
