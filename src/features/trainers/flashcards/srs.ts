// Интервальное повторение по фиксированной лесенке: правильный ответ ведёт
// на следующую ступень, «Забыл» и «Трудно» в любой день возвращают на
// первую. Колонка ease_factor в word_progress осталась от прежнего SM-2 и
// не используется.
export type SrsRating = "again" | "hard" | "good" | "easy";

export const INTERVAL_LADDER = [1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 48] as const;

export const FAILING_RATINGS: readonly SrsRating[] = ["again", "hard"];

export function isFailingRating(rating: SrsRating): boolean {
  return FAILING_RATINGS.includes(rating);
}

export type SrsState = {
  intervalDays: number;
  repetitions: number;
};

export type SrsResult = SrsState & { dueAt: Date };

// Следующая ступень — первая из лесенки, строго большая текущего
// интервала: так слова со старыми интервалами SM-2 (6, 15, 38 дней)
// переходят на лесенку без пересчёта.
export function nextInterval(currentDays: number): number {
  return INTERVAL_LADDER.find((step) => step > currentDays) ?? INTERVAL_LADDER[INTERVAL_LADDER.length - 1];
}

export function applySrs(
  state: SrsState,
  rating: SrsRating,
  now: Date = new Date(),
): SrsResult {
  const failed = isFailingRating(rating);
  const intervalDays = failed ? INTERVAL_LADDER[0] : nextInterval(state.intervalDays);
  const repetitions = failed ? 0 : state.repetitions + 1;
  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { intervalDays, repetitions, dueAt };
}
