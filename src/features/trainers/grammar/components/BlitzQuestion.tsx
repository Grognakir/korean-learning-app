"use client";

import { useEffect, useRef, useState } from "react";
import type { BlitzQuestion } from "../types";
import styles from "./GrammarTrainer.module.css";

const TICK_MS = 50;
const ADVANCE_OK_MS = 320;
const ADVANCE_WRONG_MS = 900;

type Props = {
  question: BlitzQuestion;
  seconds: number;
  onAnswer: (ok: boolean, chosen: string | null) => void;
  onNext: () => void;
};

// Время вышло — ответ неверный; после ответа автопереход с короткой паузой,
// чтобы успеть увидеть верный вариант.
export function BlitzQuestionCard({ question, seconds, onAnswer, onNext }: Props) {
  const total = seconds * 1000;
  const [remaining, setRemaining] = useState(total);
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const answered = useRef(false);
  const advance = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef({ question, onAnswer, onNext });
  useEffect(() => {
    latest.current = { question, onAnswer, onNext };
  });

  const finish = useRef((option: string | null) => {
    if (answered.current) return;
    answered.current = true;
    const { question: current, onAnswer: answer, onNext: next } = latest.current;
    const ok = option === current.answer;
    setChosen(option);
    answer(ok, option);
    advance.current = setTimeout(() => next(), ok ? ADVANCE_OK_MS : ADVANCE_WRONG_MS);
  });

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      if (answered.current) return clearInterval(id);
      const left = Math.max(0, total - (Date.now() - started));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        finish.current(null);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [total]);

  useEffect(() => () => clearTimeout(advance.current), []);

  const isAnswered = chosen !== undefined;

  function optionClass(option: string) {
    if (!isAnswered) return styles.option;
    if (option === question.answer) return styles.optionOk;
    if (option === chosen) return styles.optionBad;
    return styles.option;
  }

  return (
    <>
      <div className={remaining < total * 0.35 ? styles.clockLow : styles.clock} aria-hidden="true">
        <span style={{ width: `${(remaining / total) * 100}%` }} />
      </div>
      <div className={styles.card}>
        <p className={`${styles.blitzPrompt} ${question.dir === "kr" ? "kr" : ""}`}>{question.prompt}</p>
        <div className={styles.blitzOptions}>
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              className={`${optionClass(option)} ${question.dir === "ru" ? "kr" : ""}`}
              disabled={isAnswered}
              onClick={() => finish.current(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.note}>{seconds} сек на вопрос</p>
    </>
  );
}
