"use client";

import { useEffect, useRef, useState } from "react";
import type { VocabListBlock } from "@/features/learning/types";
import {
  loadProgress,
  priorityOrder,
  recordRating,
  useVocabProgress,
  VOCAB_PROGRESS_KEY,
  type Rating,
} from "@/features/learning/vocabProgress";
import { useUserStorageKey } from "@/lib/StorageUser";
import styles from "./blocks.module.css";

type Mode = "kr-ru" | "ru-kr" | "type";

const MODES: { id: Mode; label: string }[] = [
  { id: "kr-ru", label: "Корейский → Русский" },
  { id: "ru-kr", label: "Русский → Корейский" },
  { id: "type", label: "Корейское написание" },
];

// Как запомнилось: «Не знаю» и «Не помню» возвращают карточку в очередь
// (через 2 и 4 слова), «Вспомнил» и «Знаю» убирают её из очереди.
const RATINGS: { rating: Rating; label: string; reinsertAfter: number }[] = [
  { rating: "again", label: "Не знаю", reinsertAfter: 2 },
  { rating: "hard", label: "Не помню", reinsertAfter: 4 },
  { rating: "good", label: "Вспомнил", reinsertAfter: 0 },
  { rating: "easy", label: "Знаю", reinsertAfter: 0 },
];

const RATING_CLASS: Record<Rating, string> = {
  again: styles.rateAgain,
  hard: styles.rateHard,
  good: styles.rateGood,
  easy: styles.rateEasy,
};

const STATUS_CLASS: Record<Rating, string> = {
  again: styles.statusAgain,
  hard: styles.statusHard,
  good: styles.statusGood,
  easy: styles.statusEasy,
};

/** Очередь после оценки карточки на позиции `index`. */
export function queueAfterRating(
  order: number[],
  index: number,
  reinsertAfter: number,
): number[] {
  const rest = order.filter((_, i) => i !== index);
  if (reinsertAfter === 0) return rest;
  const insertAt = Math.min(index + reinsertAfter, rest.length);
  return [...rest.slice(0, insertAt), order[index], ...rest.slice(insertAt)];
}

// Новая тренировка начинается с тех слов, которые раньше не знал или не
// помнил, затем новые, затем выученные (когда подошёл срок повторения).
function startOrder(items: { ko: string }[], storageKey: string): number[] {
  return priorityOrder(
    items.map((item) => item.ko),
    loadProgress(storageKey),
  );
}

function normalize(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, "");
}

export function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 16" width="22" height="14" aria-hidden="true">
      <path
        d={
          direction === "left" ? "M21 8H3M8 3L3 8l5 5" : "M3 8h18M16 3l5 5-5 5"
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M3 8.5l3.2 3.2L13 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResetIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v2.8h-2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModeSelect({
  mode,
  onPick,
}: {
  mode: Mode;
  onPick: (mode: Mode) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Escape закрывает только список, а не всё окно тренировки.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.trainerSelect}>
      <button
        type="button"
        className={styles.trainerSelectTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{active.label}</span>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d="M3 6l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul
          className={styles.trainerSelectList}
          role="listbox"
          aria-label="Режим тренировки"
        >
          {MODES.map((m) => (
            <li key={m.id} role="option" aria-selected={m.id === mode}>
              <button
                type="button"
                className={
                  m.id === mode
                    ? styles.trainerSelectOptionActive
                    : styles.trainerSelectOption
                }
                onClick={() => {
                  onPick(m.id);
                  setOpen(false);
                }}
              >
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Размер шрифта по длине текста: длинное слово или перевод не растягивают
// карточку, а ужимаются и переносятся внутри неё.
function frontSize(text: string): string | undefined {
  if (text.length <= 8) return undefined;
  return text.length <= 14 ? styles.vocabCardMedium : styles.vocabCardSmall;
}

function backSize(text: string): string | undefined {
  if (text.length <= 28) return undefined;
  return text.length <= 70 ? styles.vocabCardMedium : styles.vocabCardSmall;
}

export function VocabTrainer({ items }: { items: VocabListBlock["items"] }) {
  const total = items.length;
  const storageKey = useUserStorageKey(VOCAB_PROGRESS_KEY);
  const [mode, setMode] = useState<Mode>("kr-ru");
  const [order, setOrder] = useState(() => startOrder(items, storageKey));
  const [index, setIndex] = useState(0);
  const [learned, setLearned] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const progress = useVocabProgress(storageKey);
  const queueLength = order.length;
  const item = items[order[index]];

  function clearAttempt() {
    setFlipped(false);
    setAnswer("");
    setCorrect(null);
  }

  function restart() {
    setOrder(startOrder(items, storageKey));
    setIndex(0);
    setLearned(0);
    clearAttempt();
  }

  function go(step: number) {
    if (queueLength === 0) return;
    setIndex((value) => (value + step + queueLength) % queueLength);
    clearAttempt();
  }

  function rate(rating: Rating) {
    const { reinsertAfter } = RATINGS.find((r) => r.rating === rating)!;
    const next = queueAfterRating(order, index, reinsertAfter);
    recordRating(item.ko, rating, undefined, storageKey);
    if (reinsertAfter === 0) setLearned((value) => value + 1);
    setOrder(next);
    setIndex(next.length === 0 ? 0 : Math.min(index, next.length - 1));
    clearAttempt();
  }

  function pickMode(next: Mode) {
    setMode(next);
    clearAttempt();
  }

  function check() {
    if (!item) return;
    setCorrect(normalize(answer) === normalize(item.ko));
  }

  const resetButton = (
    <button
      type="button"
      className={styles.trainerReset}
      onClick={restart}
      aria-label="Перемешать заново"
    >
      <ResetIcon />
    </button>
  );

  const showKorean = mode === "kr-ru" ? !flipped : flipped;
  const done = queueLength === 0;
  const previous = item ? progress[item.ko] : undefined;

  return (
    <div className={styles.trainer}>
      <ModeSelect mode={mode} onPick={pickMode} />
      <nav className={styles.trainerSide} aria-label="Режим тренировки">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={
              m.id === mode ? styles.trainerModeActive : styles.trainerMode
            }
            aria-pressed={m.id === mode}
            onClick={() => pickMode(m.id)}
          >
            <span>{m.label}</span>
          </button>
        ))}
      </nav>
      <div className={styles.trainerMain}>
        <div className={styles.trainerStage}>
          <div className={styles.vocabCardWrap}>
            {done ? (
              <div className={styles.vocabCard} aria-live="polite">
                <span className={styles.vocabCardBack}>
                  ✓ Все слова пройдены: {learned} из {total}
                </span>
              </div>
            ) : mode === "type" ? (
              <div className={styles.vocabCard} aria-live="polite">
                <span
                  className={`${styles.vocabCardBack} ${backSize(item.translation_ru) ?? ""}`}
                >
                  {item.translation_ru}
                </span>
                {correct !== null && (
                  <span
                    className={correct ? styles.trainerOk : styles.trainerBad}
                  >
                    {correct ? (
                      "✓ Верно"
                    ) : (
                      <>
                        ✗ Правильно: <span className="kr">{item.ko}</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                className={styles.vocabCard}
                onClick={() => setFlipped((value) => !value)}
                aria-label={flipped ? "Скрыть ответ" : "Показать ответ"}
              >
                {showKorean ? (
                  <span
                    className={`${styles.vocabCardFront} ${frontSize(item.ko) ?? ""} kr`}
                  >
                    {item.ko}
                  </span>
                ) : (
                  <span
                    className={`${styles.vocabCardBack} ${backSize(item.translation_ru) ?? ""}`}
                  >
                    {item.translation_ru}
                  </span>
                )}
              </button>
            )}
            {previous && !done && (
              <span className={`${styles.vocabCardStatus} ${STATUS_CLASS[previous.rating]}`}>
                Раньше: {RATINGS.find((r) => r.rating === previous.rating)?.label}
              </span>
            )}
            {resetButton}
            <div className={styles.vocabCardNav}>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Предыдущее слово"
              >
                <Arrow direction="left" />
              </button>
              <span>
                {done ? 0 : index + 1} / {queueLength}
              </span>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Следующее слово"
              >
                <Arrow direction="right" />
              </button>
            </div>
          </div>
          <div className={styles.trainerControls}>
            {mode === "type" ? (
              <div className={styles.trainerAnswer}>
                <input
                  className={
                    correct === null
                      ? styles.trainerInput
                      : correct
                        ? styles.trainerInputCorrect
                        : styles.trainerInputIncorrect
                  }
                  value={answer}
                  disabled={done}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setCorrect(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    if (e.key !== "Enter") return;
                    if (correct === null) check();
                    else go(1);
                  }}
                  placeholder="Слово на корейском"
                  aria-label="Ответ по-корейски"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className={styles.trainerCheck}
                  onClick={check}
                  disabled={done}
                  aria-label="Проверить"
                >
                  <CheckIcon />
                </button>
              </div>
            ) : (
              <div
                className={styles.trainerRatings}
                role="group"
                aria-label="Как запомнилось"
              >
                {RATINGS.map((r) => (
                  <button
                    key={r.rating}
                    type="button"
                    className={RATING_CLASS[r.rating]}
                    disabled={!flipped || done}
                    onClick={() => rate(r.rating)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
