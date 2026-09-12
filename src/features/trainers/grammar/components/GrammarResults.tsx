import Link from "next/link";
import type { Mistake, StageScore } from "../types";
import { Dock } from "./parts";
import styles from "./GrammarTrainer.module.css";

type Props = {
  score: { study: StageScore; practice: StageScore; blitz: StageScore };
  mistakes: Mistake[];
  setupHref: string;
};

export function GrammarResults({ score, mistakes, setupHref }: Props) {
  const stages = [
    { label: "Изучение", value: score.study },
    { label: "Практика", value: score.practice },
    { label: "Блиц", value: score.blitz },
  ];
  const correct = stages.reduce((sum, s) => sum + s.value.correct, 0);
  const total = stages.reduce((sum, s) => sum + s.value.total, 0);
  const weak = [...new Set(mistakes.map((m) => m.pattern))];

  return (
    <>
      <div className={styles.resultCard}>
        <span className={styles.eyebrow}>Сессия завершена</span>
        <p className={styles.resultNumber}>{total ? Math.round((correct / total) * 100) : 0}<span>%</span></p>
        <p className={styles.muted}>{correct} из {total} верных ответов за сессию</p>
      </div>
      <div className={styles.scoreGrid}>
        {stages.map((stage) => (
          <div key={stage.label}>
            <b>{stage.value.correct}/{stage.value.total}</b>
            <span>{stage.label}</span>
          </div>
        ))}
      </div>
      {weak.length > 0 ? (
        <>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>К повторению</h2>
            <ul className={styles.chips}>
              {weak.map((pattern) => <li key={pattern} className={`${styles.chip} kr`}>{pattern}</li>)}
            </ul>
          </section>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Ошибки — {mistakes.length}</h2>
            <ol className={styles.mistakes}>
              {mistakes.map((mistake, i) => {
                const answerClass = mistake.koreanAnswer ? "kr" : "";
                return (
                  <li key={i}>
                    <p className={`${styles.muted} ${mistake.koreanAnswer ? "" : "kr"}`}>{mistake.question}</p>
                    <p className={`${styles.yours} ${answerClass}`}><s>{mistake.yours.trim() || "— пусто —"}</s></p>
                    <p className={`${styles.right} ${answerClass}`}>{mistake.answer}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      ) : (
        <div className={styles.card}>
          <p className={styles.verdictOk}>Ни одной ошибки</p>
        </div>
      )}
      <Dock>
        <Link href={setupHref} className={styles.primary}>Новая сессия</Link>
      </Dock>
    </>
  );
}
