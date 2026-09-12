"use client";

import { useState } from "react";
import { formatBold } from "@/lib/formatBold";
import { checkAnswer } from "../checkAnswer";
import type { Mistake, StudyItem } from "../types";
import { AnswerReview, Dock, DrillPrompt, KoreanInput, scrollToTop } from "./parts";
import styles from "./GrammarTrainer.module.css";

type Props = {
  item: StudyItem;
  nextLabel: string;
  onRecord: (ok: boolean, mistake?: Mistake) => void;
  onNext: () => void;
};

// Правило → мини-проверка преобразованиями → разбор.
export function StudyStep({ item, nextLabel, onRecord, onNext }: Props) {
  const [phase, setPhase] = useState<"rule" | "quiz" | "review">("rule");
  const [values, setValues] = useState(() => item.quiz.map(() => ""));
  const [results, setResults] = useState<boolean[]>([]);

  function check() {
    const next = item.quiz.map((drill, i) => checkAnswer(drill.answers, values[i]));
    next.forEach((ok, i) => onRecord(ok, {
      pattern: item.pattern,
      question: item.quiz[i].task_ru,
      answer: item.quiz[i].answers[0],
      yours: values[i],
      koreanAnswer: true,
    }));
    setResults(next);
    setPhase("review");
    scrollToTop();
  }

  if (phase === "rule") {
    return (
      <>
        <article className={styles.ruleCard}>
          <h2 className={`${styles.pattern} kr`}>{item.pattern}</h2>
          {item.meaning && <p className={styles.meaning}>{item.meaning}</p>}
          {item.explanation && <p className={styles.explanation}>{formatBold(item.explanation)}</p>}
          {item.rules.length > 0 && <>
            <h3 className={styles.sectionTitle}>Как строится</h3>
            <ul className={styles.list}>{item.rules.map((rule, i) => <li key={i}>{formatBold(rule)}</li>)}</ul>
          </>}
          {item.usage.length > 0 && <>
            <h3 className={styles.sectionTitle}>Когда используется</h3>
            <ul className={styles.list}>{item.usage.map((line, i) => <li key={i}>{formatBold(line)}</li>)}</ul>
          </>}
          {item.examples.length > 0 && <>
            <h3 className={styles.sectionTitle}>Примеры</h3>
            <ul className={styles.examples}>
              {item.examples.map((example, i) => (
                <li key={i}><span className="kr">{example.kr}</span><span className={styles.exampleRu}>{example.ru}</span></li>
              ))}
            </ul>
          </>}
        </article>
        <Dock>
          <button type="button" className={styles.primary} onClick={() => { setPhase("quiz"); scrollToTop(); }}>Продолжить</button>
        </Dock>
      </>
    );
  }

  if (phase === "quiz") {
    return (
      <>
        <div className={styles.card}>
          <p className={styles.prompt}>Проверим понимание</p>
          <p className={`${styles.sentence} kr`}>{item.pattern}</p>
          {item.meaning && <p className={styles.muted}>{item.meaning}</p>}
        </div>
        {item.quiz.map((drill, i) => (
          <div key={i} className={styles.card}>
            <p className={styles.prompt}>Задание {i + 1} из {item.quiz.length}</p>
            <DrillPrompt drill={drill} />
            <KoreanInput
              aria-label={drill.task_ru}
              value={values[i]}
              onChange={(event) => {
                const value = event.target.value;
                setValues((prev) => prev.map((v, j) => (j === i ? value : v)));
              }}
            />
          </div>
        ))}
        <Dock>
          <button type="button" className={styles.primary} onClick={check}>Проверить</button>
        </Dock>
      </>
    );
  }

  const correct = results.filter(Boolean).length;
  const allOk = correct === results.length;
  return (
    <>
      <div className={styles.card} role="status">
        <p className={allOk ? styles.verdictOk : styles.verdictBad}>{allOk ? "Всё верно" : `Верно ${correct} из ${results.length}`}</p>
        <p className={styles.muted}>{allOk ? "Идём дальше." : "Посмотрите правильные варианты — эта грамматика ещё вернётся в практике."}</p>
      </div>
      {item.quiz.map((drill, i) => (
        <AnswerReview key={i} ok={results[i]} task={drill.task_ru} yours={values[i]} answers={drill.answers} />
      ))}
      <Dock>
        <button type="button" className={styles.primary} onClick={onNext}>{nextLabel}</button>
      </Dock>
    </>
  );
}
