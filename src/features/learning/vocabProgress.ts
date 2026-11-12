import { useSyncExternalStore } from "react";
import { readWithLegacy } from "@/lib/legacyStorage";

export type Rating = "again" | "hard" | "good" | "easy";

export type WordProgress = { rating: Rating; at: number; reviews: number };
export type VocabProgress = Record<string, WordProgress>;

export const VOCAB_PROGRESS_KEY = "vocab-progress:v1";
const OWNER_KEY = "vocab-progress:legacy-owner";
const EVENT = "vocab-progress";
const DAY = 24 * 60 * 60 * 1000;
const EMPTY: VocabProgress = {};
const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

// Кэш, резервная копия в памяти и признак неудачной записи ведутся по
// каждому ключу хранилища отдельно: у каждого аккаунта свой ключ.
const caches = new Map<string, { raw: string | null; value: VocabProgress }>();
const memory = new Map<string, VocabProgress>();
const failed = new Set<string>();

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
 * сохраняются в браузере между тренировками и сессиями. Ключ хранилища —
 * свой у каждого аккаунта (см. useUserStorageKey). */
export function loadProgress(storageKey: string = VOCAB_PROGRESS_KEY): VocabProgress {
  if (typeof window === "undefined") return EMPTY;
  // После неудачной записи в localStorage остаётся прежнее значение, а
  // актуальное — только в памяти.
  if (failed.has(storageKey)) return memory.get(storageKey) ?? EMPTY;
  try {
    const scoped = /^user:([^:]+):(.+)$/.exec(storageKey);
    const raw = readWithLegacy(
      storageKey,
      scoped ? scoped[2] : storageKey,
      OWNER_KEY,
      scoped?.[1],
    );
    const cached = caches.get(storageKey);
    if (cached && cached.raw === raw) return cached.value;
    const value = parse(raw);
    caches.set(storageKey, { raw, value });
    return value;
  } catch {
    return memory.get(storageKey) ?? EMPTY;
  }
}

export function recordRating(
  ko: string,
  rating: Rating,
  now = Date.now(),
  storageKey: string = VOCAB_PROGRESS_KEY,
) {
  const current = loadProgress(storageKey);
  const next: VocabProgress = {
    ...current,
    [ko]: { rating, at: now, reviews: (current[ko]?.reviews ?? 0) + 1 },
  };
  memory.set(storageKey, next);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    failed.delete(storageKey);
  } catch {
    // Хранилище недоступно или переполнено — оценки живут в памяти до
    // перезагрузки страницы, а чтение берёт их оттуда.
    failed.add(storageKey);
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

export function useVocabProgress(storageKey: string = VOCAB_PROGRESS_KEY): VocabProgress {
  return useSyncExternalStore(subscribe, () => loadProgress(storageKey), () => EMPTY);
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
