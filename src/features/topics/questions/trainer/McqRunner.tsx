"use client";

import { useRef, useState } from "react";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import styles from "./Trainer.module.css";

export type McqItem = {
  promptKr: string | null;
  promptRu: string | null;
  optsAreKr: boolean;
  opts: string[];
  correctIndex: number;
  explanationKr: string;
  explanationRr: string;
  explanationRu: string;
};

export function McqRunner({
  title,
  buildSession,
  onBack,
  onNextLevel,
}: {
  title: string;
  buildSession: () => McqItem[];
  onBack: () => void;
  onNextLevel?: () => void;
}) {
  const [items, setItems] = useState<McqItem[]>(buildSession);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const advancing = useRef(false);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  function restart() {
    setItems(buildSession());
    setIndex(0);
    setSelectedIndex(null);
    setScore(0);
    advancing.current = false;
    requestAnimationFrame(() => promptRef.current?.focus());
  }

  if (index >= items.length) {
    const perfect = score === items.length;
    return (
      <div className={styles.done}>
        <span className={styles.eyebrow}>Результат</span>
        <h3 ref={doneRef} tabIndex={-1} className={styles.doneTitle}>
          {perfect ? "Все верно — 완벽해요!" : "Хороший прогон"}
        </h3>
        <p className={styles.score}>
          {score}
          <span> / {items.length}</span>
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.runnerBack} onClick={onBack}>
            Все уровни
          </button>
          <button type="button" className={styles.secondary} onClick={restart}>
            Ещё раз
          </button>
          {onNextLevel && (
            <button type="button" className={styles.next} onClick={onNextLevel}>
              Следующий уровень
            </button>
          )}
        </div>
      </div>
    );
  }

  const item = items[index];
  const answered = selectedIndex !== null;
  const isCorrect = answered && selectedIndex === item.correctIndex;

  function optionClass(optionIndex: number) {
    if (!answered) return styles.option;
    if (optionIndex === item.correctIndex) return styles.optionCorrect;
    if (optionIndex === selectedIndex) return styles.optionWrong;
    return styles.optionMuted;
  }

  function choose(optionIndex: number) {
    if (answered) return;
    setSelectedIndex(optionIndex);
    if (optionIndex === item.correctIndex) setScore((s) => s + 1);
  }

  function next() {
    if (!answered || advancing.current) return;
    advancing.current = true;
    setIndex((i) => i + 1);
    setSelectedIndex(null);
    requestAnimationFrame(() => {
      advancing.current = false;
      promptRef.current?.focus();
    });
  }

  return (
    <div className={styles.root}>
      <div className={styles.runnerTop}>
        <button type="button" className={styles.runnerBack} onClick={onBack}>
          ← Уровни
        </button>
        <span className={styles.runnerTitle}>{title}</span>
      </div>
      <SessionProgress completed={index} total={items.length} label="Выберите правильный ответ" />
      <div className={styles.prompt}>
        <p
          ref={promptRef}
          tabIndex={-1}
          className={`${styles.headword} ${item.promptKr ? "kr" : ""}`}
        >
          {item.promptKr ?? item.promptRu}
        </p>
      </div>
      <div className={styles.options}>
        {item.opts.map((option, optionIndex) => (
          <button
            key={optionIndex}
            type="button"
            className={`${optionClass(optionIndex)} ${item.optsAreKr ? "kr" : ""}`}
            disabled={answered}
            onClick={() => choose(optionIndex)}
          >
            {option}
          </button>
        ))}
      </div>
      {answered && (
        <>
          <div className={isCorrect ? styles.feedbackCorrect : styles.feedbackWrong} role="status">
            <strong>{isCorrect ? "Верно!" : "Не совсем."}</strong>
            <span className="kr">{item.explanationKr}</span>
            <span className={styles.rr}>{item.explanationRr}</span>
            <span>— {item.explanationRu}</span>
          </div>
          <button type="button" className={styles.next} onClick={next}>
            {index + 1 === items.length ? "Итог" : "Далее"}
          </button>
        </>
      )}
    </div>
  );
}
