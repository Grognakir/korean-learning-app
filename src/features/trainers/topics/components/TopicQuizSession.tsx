"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import { shuffleOptions } from "../shuffleOptions";
import type { TopicQuizQuestion } from "../types";
import styles from "./TopicQuizSession.module.css";

type Answer = { question: TopicQuizQuestion; selected: string };

function promptText(question: TopicQuizQuestion) {
  return question.question_text || `${question.before_text ?? ""} … ${question.after_text ?? ""}`;
}

export function TopicQuizSession({ questions }: { questions: TopicQuizQuestion[] }) {
  const [items, setItems] = useState(questions);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const advancingRef = useRef(false);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const summaryRef = useRef<HTMLHeadingElement>(null);

  function restart(nextItems: TopicQuizQuestion[], mistakesOnly: boolean) {
    setItems(shuffleOptions(nextItems));
    setIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    setReviewing(mistakesOnly);
    advancingRef.current = false;
    requestAnimationFrame(() => promptRef.current?.focus());
  }

  if (items.length === 0) {
    return <div className={styles.done}>
      <h2 className={styles.doneTitle}>Вопросов пока нет</h2>
      <p className={styles.doneText}>Попробуйте другую тему.</p>
      <Link href="/learning/trainers/topics" className={styles.backLink}>Выбрать тему →</Link>
    </div>;
  }

  if (index >= items.length) {
    const mistakes = answers.filter((answer) => answer.selected !== answer.question.correct);
    const score = answers.length - mistakes.length;
    return (
      <div className={styles.done}>
        <span className={styles.eyebrow}>{reviewing ? "Работа над ошибками" : "Результат тренировки"}</span>
        <h2 ref={summaryRef} tabIndex={-1} className={styles.doneTitle}>{mistakes.length ? "Есть что закрепить" : "Отличная работа!"}</h2>
        <p className={styles.score}>{Math.round(score / items.length * 100)}<span>%</span></p>
        <p className={styles.doneText}>{score} из {items.length} верно</p>
        <div className={styles.actions}>
          {mistakes.length > 0 && <button type="button" className={styles.next} onClick={() => restart(mistakes.map((answer) => answer.question), true)}>Повторить ошибки ({mistakes.length})</button>}
          <button type="button" className={styles.secondary} onClick={() => restart(questions, false)}>Пройти заново</button>
          <Link href="/learning/trainers/topics" className={styles.backLink}>Другие темы →</Link>
        </div>
        {mistakes.length > 0 && <section className={styles.review} aria-label="Разбор ошибок">
          <h3 className={styles.hintLabel}>Разбор ошибок</h3>
          <ol className={styles.reviewList}>
            {mistakes.map(({ question, selected }, i) => <li key={`${question.id}-${i}`}>
              <p className="kr">{promptText(question)}</p>
              <p className={styles.mistakeAnswer}>Ваш ответ: <span className="kr">{selected}</span></p>
              <p>Верно: <strong className="kr">{question.correct}</strong></p>
              {question.translation_ru && <p className={styles.translation}>{question.translation_ru}</p>}
            </li>)}
          </ol>
        </section>}
      </div>
    );
  }

  const question = items[index];
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
    if (selected === null || advancingRef.current) return;
    advancingRef.current = true;
    setAnswers((prev) => [...prev, { question, selected }]);
    setSelectedIndex(null);
    setIndex((i) => i + 1);
    requestAnimationFrame(() => {
      if (index + 1 >= items.length) summaryRef.current?.focus();
      else promptRef.current?.focus();
    });
  }

  return (
    <div className={styles.root}>
      <SessionProgress completed={index} total={items.length} label={reviewing ? "Закрепляем ошибки" : "Выберите правильный ответ"} />
      <div className={styles.prompt}>
        <span className={styles.eyebrow}>{question.question_text ? "Вопрос" : "Заполните пропуск"}</span>
        <p ref={promptRef} tabIndex={-1} className={`${styles.headword} ${question.question_text ? "" : "kr"}`}>
          {question.question_text || <>{question.before_text}<span className={answered ? isCorrect ? styles.blankFilledCorrect : styles.blankFilledWrong : styles.blank}>{answered ? selected : "…"}</span>{question.after_text}</>}
        </p>
      </div>
      <div className={styles.options}>
        {question.options.map((option, optionIndex) => (
          <button key={optionIndex} type="button" className={`${optionClass(option, optionIndex)} kr`} disabled={answered} onClick={() => { advancingRef.current = false; setSelectedIndex(optionIndex); }}>
            <span className={styles.optionNumber} aria-hidden="true">{optionIndex + 1}</span>
            <span>{option}</span>
            {answered && (option === question.correct || optionIndex === selectedIndex) && <span aria-hidden="true">{option === question.correct ? "✓" : "×"}</span>}
          </button>
        ))}
      </div>
      {answered && <>
        <div className={isCorrect ? styles.feedbackCorrect : styles.feedbackWrong} role="status">
          <strong>{isCorrect ? "Верно!" : "Не совсем. Правильный ответ:"}</strong>
          {!isCorrect && <span className="kr">{question.correct}</span>}
        </div>
        {question.translation_ru && <p className={styles.translation}>{question.translation_ru}</p>}
        {question.hint && question.hint.length > 0 && <div className={styles.hint}>
          <span className={styles.hintLabel}>Запомните</span>
          <ul className={styles.hintList}>{question.hint.map((item, i) => <li key={i}><span className="kr">{item.kr}</span>{item.ru ? ` — ${item.ru}` : ""}</li>)}</ul>
        </div>}
        <button type="button" className={styles.next} onClick={next}>{index + 1 === items.length ? "Посмотреть результат" : "Далее"}</button>
      </>}
    </div>
  );
}
