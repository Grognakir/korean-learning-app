"use client";

import Link from "next/link";
import { useState } from "react";
import type { TopicQuizQuestion } from "../types";
import styles from "./TopicQuizSession.module.css";

export function TopicQuizSession({
  questions,
}: {
  questions: TopicQuizQuestion[];
}) {
  const [index, setIndex] = useState(0);
  // Индекс, а не текст: варианты ответа в вопросе могут повторяться, и
  // по тексту нельзя отличить выбранный вариант от его дубля.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  if (questions.length === 0) {
    return <p className={styles.empty}>Вопросов пока нет.</p>;
  }

  if (index >= questions.length) {
    return (
      <div className={styles.done}>
        <h2 className={styles.doneTitle}>Готово</h2>
        <p className={styles.doneText}>
          {score} из {questions.length} верно
        </p>
        <Link href="/learning/trainers/topics" className={styles.backLink}>
          Назад
        </Link>
      </div>
    );
  }

  const question = questions[index];
  const answered = selectedIndex !== null;
  const selected = answered ? question.options[selectedIndex] : null;
  const isCorrect = selected === question.correct;

  function optionClass(option: string, optionIndex: number) {
    if (!answered) return styles.option;
    if (option === question.correct) return styles.optionCorrect;
    if (optionIndex === selectedIndex) return styles.optionWrong;
    return styles.optionMuted;
  }

  function next() {
    if (isCorrect) setScore((n) => n + 1);
    setSelectedIndex(null);
    setIndex((i) => i + 1);
  }

  return (
    <div className={styles.root}>
      <p className={styles.progress}>
        {index + 1} / {questions.length}
      </p>

      <div className={styles.prompt}>
        {question.question_text ? (
          <p className={styles.headword}>{question.question_text}</p>
        ) : (
          <p className={`${styles.headword} kr`}>
            {question.before_text}
            <span
              className={
                answered
                  ? isCorrect
                    ? styles.blankFilledCorrect
                    : styles.blankFilledWrong
                  : styles.blank
              }
            >
              {answered ? selected : "\u00a0\u00a0\u00a0\u00a0"}
            </span>
            {question.after_text}
          </p>
        )}
      </div>

      <div className={styles.options}>
        {question.options.map((option, optionIndex) => (
          <button
            key={optionIndex}
            type="button"
            className={`${optionClass(option, optionIndex)} kr`}
            disabled={answered}
            onClick={() => setSelectedIndex(optionIndex)}
          >
            {option}
          </button>
        ))}
      </div>

      {answered && (
        <>
          {question.translation_ru && (
            <p className={styles.translation}>{question.translation_ru}</p>
          )}
          {question.hint && question.hint.length > 0 && (
            <div className={styles.hint}>
              <span className={styles.hintLabel}>Подсказка</span>
              <ul className={styles.hintList}>
                {question.hint.map((item, i) => (
                  <li key={i}>
                    <span className="kr">{item.kr}</span>
                    {item.ru ? ` — ${item.ru}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button type="button" className={styles.next} onClick={next}>
            Далее
          </button>
        </>
      )}
    </div>
  );
}
