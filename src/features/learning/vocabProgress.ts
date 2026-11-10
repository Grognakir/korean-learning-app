import { useSyncExternalStore } from "react";

export type Rating = "again" | "hard" | "good" | "easy";

export type WordProgress = { rating: Rating; at: number; reviews: number };
export type VocabProgress = Record<string, WordProgress>;

const STORAGE_KEY = "vocab-progress:v1";
const EVENT = "vocab-progress";
const DAY = 24 * 60 * 60 * 1000;
const EMPTY: VocabProgress = {};
const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

let cachedRaw: string | null = null;
let cachedValue: VocabProgress = EMPTY;
const memory: { value: VocabProgress | null } = { value: null };

function parse(raw: string | null): VocabProgress {
  if (!raw) return EMPTY;
  try {
    const data = JSON.parse(raw) as Record<string, Partial<WordProgress>>;
    const result: VocabProgress = {};
    for (const [ko, entry] of Object.entries(data)) {
      if (
        entry &&
        RATINGS.includes(entry.rating as Rating) &&
        typeof entry.at === "number"
      ) {
        result[ko] = {
          rating: entry.rating as Rating,
          at: entry.at,
          reviews: typeof entry.reviews === "number" ? entry.reviews : 1,
        };
      }
    }
    return result;
  } catch {
    return EMPTY;
  }
}

/** Результаты оценок слов (по написанию `ko`) — общие для всех разделов и
 * сохраняются в браузере между тренировками и сессиями. */
export function loadProgress(): VocabProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = parse(raw);
    }
    return cachedValue;
  } catch {
    return memory.value ?? EMPTY;
  }
}

export function recordRating(ko: string, rating: Rating, now = Date.now()) {
  const current = loadProgress();
  const next: VocabProgress = {
    ...current,
    [ko]: { rating, at: now, reviews: (current[ko]?.reviews ?? 0) + 1 },
  };
  memory.value = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Хранилище недоступно — оценки живут до перезагрузки страницы.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useVocabProgress(): VocabProgress {
  return useSyncExternalStore(subscribe, loadProgress, () => EMPTY);
}

/** Чем меньше число, тем раньше слово в тренировке: не знал и не помнил —
 * первыми, новые — следом, а выученные возвращаются, когда пора повторить
 * (хорошо вспомнил — через 3 дня, знаю — через 7). */
export function priorityOf(
  progress: WordProgress | undefined,
  now: number,
): number {
  if (!progress) return 2;
  if (progress.rating === "again") return 0;
  if (progress.rating === "hard") return 1;
  const age = now - progress.at;
  if (progress.rating === "good") return age >= 3 * DAY ? 2 : 3;
  return age >= 7 * DAY ? 2 : 4;
}

/** Порядок карточек: по приоритету, внутри одного приоритета — случайно. */
export function priorityOrder(
  words: string[],
  progress: VocabProgress,
  now = Date.now(),
  random: () => number = Math.random,
): number[] {
  return words
    .map((ko, index) => ({
      index,
      priority: priorityOf(progress[ko], now),
      tie: random(),
    }))
    .sort((a, b) => a.priority - b.priority || a.tie - b.tie)
    .map((entry) => entry.index);
}

export function isKnown(progress: WordProgress | undefined): boolean {
  return progress?.rating === "good" || progress?.rating === "easy";
}
