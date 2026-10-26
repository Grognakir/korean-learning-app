"use client";

import { useEffect, useRef, useState } from "react";
import type { VocabListBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

type Mode = "kr-ru" | "ru-kr" | "type";

const MODES: { id: Mode; label: string }[] = [
  { id: "kr-ru", label: "Корейский → Русский" },
  { id: "ru-kr", label: "Русский → Корейский" },
  { id: "type", label: "Корейское написание" },
];

function shuffled(count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function normalize(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, "");
}

function Arrow({ direction }: { direction: "left" | "right" }) {
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

function ResetIcon() {
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
  const [mode, setMode] = useState<Mode>("kr-ru");
  const [order, setOrder] = useState(() => shuffled(total));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const item = items[order[index]];

  function clearAttempt() {
    setFlipped(false);
    setAnswer("");
    setCorrect(null);
  }

  function restart() {
    setOrder(shuffled(total));
    setIndex(0);
    clearAttempt();
  }

  function go(step: number) {
    setIndex((value) => (value + step + total) % total);
    clearAttempt();
  }

  function pickMode(next: Mode) {
    setMode(next);
    clearAttempt();
  }

  function check() {
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
            {mode === "type" ? (
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
                {index + 1} / {total}
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
        </div>
        <div
          className={
            mode === "type"
              ? styles.trainerAnswerWrapOpen
              : styles.trainerAnswerWrap
          }
          aria-hidden={mode !== "type"}
        >
          <div className={styles.trainerAnswerClip}>
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
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setCorrect(null);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (correct === null) check();
                  else go(1);
                }}
                placeholder="Слово на корейском"
                aria-label="Ответ по-корейски"
                autoComplete="off"
                spellCheck={false}
                tabIndex={mode === "type" ? 0 : -1}
              />
              <button
                type="button"
                className={styles.trainerCheck}
                onClick={check}
                tabIndex={mode === "type" ? 0 : -1}
                aria-label="Проверить"
              >
                <CheckIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
