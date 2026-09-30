"use client";

import { useEffect, useRef, useState } from "react";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import { WORDS, shuffle } from "./data";
import styles from "./Trainer.module.css";

const CORRECT_ADVANCE_MS = 700;

export function TypeRunner({
  title,
  onBack,
  onNextLevel,
}: {
  title: string;
  onBack: () => void;
  onNextLevel?: () => void;
}) {
  const [order, setOrder] = useState(() => shuffle(WORDS.map((_, i) => i)));
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const advancing = useRef(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  function clearAdvanceDelay() {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (delayRef.current !== null) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [index]);

  function restart() {
    clearAdvanceDelay();
    setOrder(shuffle(WORDS.map((_, i) => i)));
    setIndex(0);
    setValue("");
    setChecked(false);
    setScore(0);
    advancing.current = false;
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (index >= order.length) {
    const perfect = score === order.length;
    return (
      <div className={styles.done}>
        <span className={styles.eyebrow}>Результат</span>
        <h3 ref={doneRef} tabIndex={-1} className={styles.doneTitle}>
          {perfect ? "Все верно — 완벽해요!" : "Хороший прогон"}
        </h3>
        <p className={styles.score}>
          {score}
          <span> / {order.length}</span>
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.doneBack} onClick={onBack}>
            Все уровни
          </button>
          <button type="button" className={styles.doneRetry} onClick={restart}>
            Ещё раз
          </button>
          {onNextLevel && (
            <button type="button" className={styles.doneNext} onClick={onNextLevel}>
              Следующий уровень
            </button>
          )}
        </div>
      </div>
    );
  }

  const word = WORDS[order[index]];
  const isCorrect = word.answers.includes(value.trim());

  function check() {
    if (checked) return;
    if (isCorrect) {
      setChecked(true);
      setScore((s) => s + 1);
      delayRef.current = setTimeout(() => advance(), CORRECT_ADVANCE_MS);
      return;
    }
    setChecked(true);
  }

  function advance() {
    clearAdvanceDelay();
    if (advancing.current) return;
    advancing.current = true;
    setIndex((i) => i + 1);
    setValue("");
    setChecked(false);
    requestAnimationFrame(() => {
      advancing.current = false;
      if (doneRef.current) doneRef.current.focus();
      else inputRef.current?.focus();
    });
  }

  function next() {
    if (!checked) return;
    advance();
  }

  return (
    <div className={styles.root}>
      <div className={styles.runnerTop}>
        <button type="button" className={styles.runnerBack} onClick={onBack}>
          ← Уровни
        </button>
        <span className={styles.runnerTitle}>{title}</span>
      </div>
      <SessionProgress completed={index} total={order.length} label="Напишите слово на корейском" />
      <div className={styles.prompt}>
        <p className={styles.headword}>{word.ru}</p>
      </div>
      <div className={styles.typeRow}>
        <input
          ref={inputRef}
          type="text"
          className={`${styles.typeInput} kr ${
            checked ? (isCorrect ? styles.typeInputOk : styles.typeInputBad) : ""
          }`}
          value={value}
          disabled={checked}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="한국어…"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") check();
          }}
        />
        <button type="button" className={styles.secondary} disabled={checked} onClick={check}>
          Проверить
        </button>
      </div>
      {checked && (
        <>
          <div className={isCorrect ? styles.feedbackCorrect : styles.feedbackWrong} role="status">
            {isCorrect ? (
              <strong>Верно!</strong>
            ) : (
              <>
                <strong>Правильный ответ:</strong>
                <span className="kr">{word.full}</span>
                <span className={styles.rr}>{word.rr}</span>
              </>
            )}
          </div>
          {!isCorrect && (
            <button type="button" className={styles.next} onClick={next}>
              {index + 1 === order.length ? "Итог" : "Далее"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
