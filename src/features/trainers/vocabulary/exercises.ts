import type { Language } from "@/features/dictionary/types";

export type PracticeWord = { id: string; headword: string; translation: string; language: Language };
export type Tile = { id: number; text: string };
export type SpellingItem = { word: PracticeWord; tiles: Tile[] };
export type PairRound = { words: PracticeWord[]; translationIds: string[] };

export function mix<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectPracticeWords(rows: { id: string; headword: string; translations: { text: string }[] }[], language: Language): PracticeWord[] {
  const headwords = new Set<string>();
  const translations = new Set<string>();
  const result: PracticeWord[] = [];
  for (const row of rows) {
    const headword = row.headword.trim().normalize("NFC");
    const translation = row.translations?.map(t => t.text.trim()).find(Boolean);
    if (!translation || !/^[\p{L}]{2,12}$/u.test(headword)) continue;
    const key = headword.toLocaleLowerCase();
    const meaning = translation.toLocaleLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
    if (headwords.has(key) || translations.has(meaning)) continue;
    headwords.add(key);
    translations.add(meaning);
    result.push({ id: row.id, headword, translation, language });
  }
  return result;
}

export function makeSpellingItems(words: PracticeWord[]): SpellingItem[] {
  return mix(words).map(word => {
    const source = Array.from(word.headword).map((text, id) => ({ id, text }));
    const tiles = mix(source);
    if (tiles.map(t => t.text).join("") === word.headword) tiles.push(tiles.shift()!);
    return { word, tiles };
  });
}

export function makePairRounds(words: PracticeWord[]): PairRound[] {
  const pool = mix(words);
  const rounds: PairRound[] = [];
  for (let i = 0; i < pool.length; i += 4) {
    const group = pool.slice(i, i + 4);
    if (group.length >= 2) rounds.push({ words: group, translationIds: mix(group.map(w => w.id)) });
  }
  return rounds;
}
