// SM-2 (SuperMemo 2) — тот же алгоритм интервального повторения, что лежит
// в основе Anki. 4 кнопки оценки после переворота карточки; quality < 3
// существует только как "again" (сброс интервала и повторений).
export type Sm2Rating = "again" | "hard" | "good" | "easy";

export type Sm2State = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export type Sm2Result = Sm2State & { dueAt: Date };

const QUALITY: Record<Sm2Rating, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
};

const MIN_EASE_FACTOR = 1.3;

export function applySm2(
  state: Sm2State,
  rating: Sm2Rating,
  now: Date = new Date(),
): Sm2Result {
  let { easeFactor, intervalDays, repetitions } = state;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  } else {
    const q = QUALITY[rating];
    easeFactor = Math.max(
      MIN_EASE_FACTOR,
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  }

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return { easeFactor, intervalDays, repetitions, dueAt };
}
