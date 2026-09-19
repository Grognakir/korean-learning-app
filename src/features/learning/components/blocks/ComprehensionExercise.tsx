"use client";

import { useState } from "react";
import type { ComprehensionExerciseBlock, ComprehensionQuestion } from "@/features/learning/types";
import styles from "./blocks.module.css";

function ChoiceQuestion({ question }: { question: ComprehensionQuestion }) {
  const [selected, setSelected] = useState<number | null>(null);
  const checkable = question.correct != null;

  return (
    <div className={styles.comprehensionQuestion}>
      <p className={`${styles.prompt} kr`}>{question.prompt}</p>
      <div className={styles.exerciseItems}>
        {question.choices?.map((choice, i) => {
          const isSelected = selected === i;
          const showResult = checkable && isSelected;
          const isCorrect = i === question.correct;
          const statusCls =
            showResult && isCorrect
              ? styles.exerciseItemCorrect
              : showResult && !isCorrect
                ? styles.exerciseItemIncorrect
                : styles.exerciseItem;
          return (
            <button
              key={i}
              type="button"
              className={`${statusCls} ${isSelected && !checkable ? styles.exerciseItemActive : ""} kr`}
              onClick={() => setSelected(i)}
            >
              <span className={styles.exerciseItemNumber} aria-hidden="true">
                {i + 1}
              </span>
              <span>{choice}</span>
            </button>
          );
        })}
      </div>
      {checkable && selected != null && (
        <p className={selected === question.correct ? styles.exerciseResultCorrect : styles.exerciseResultIncorrect}>
          {selected === question.correct ? "✓ Верно!" : <>✕ Неверно. Правильный ответ: {question.choices?.[question.correct!]}</>}
        </p>
      )}
    </div>
  );
}

function TableQuestion({ question }: { question: ComprehensionQuestion }) {
  if (!question.table) return null;
  return (
    <div className={styles.comprehensionQuestion}>
      <p className={`${styles.prompt} kr`}>{question.prompt}</p>
      <div className={styles.comprehensionTableWrap}>
        <table className={styles.comprehensionTable}>
          <thead>
            <tr>
              <th />
              {question.table.columns.map((col, i) => (
                <th key={i} className="kr">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {question.table.rows.map((row, i) => (
              <tr key={i}>
                <th className="kr">{row}</th>
                {question.table!.columns.map((_, j) => (
                  <td key={j}>
                    <input type="text" className={`${styles.comprehensionTableInput} kr`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OpenQuestion({ question }: { question: ComprehensionQuestion }) {
  return (
    <div className={styles.comprehensionQuestion}>
      <p className={`${styles.prompt} kr`}>{question.prompt}</p>
    </div>
  );
}

export function ComprehensionExercise({
  block,
  id,
}: {
  block: ComprehensionExerciseBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
      </span>
      {block.audioUrl && <audio controls src={block.audioUrl} className={styles.audio} />}
      {block.warmup && (
        <div className={styles.comprehensionWarmup}>
          {block.warmup.illustration?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.warmup.illustration.imageUrl}
              alt=""
              className={styles.illustrationImage}
            />
          ) : block.warmup.illustration ? (
            <div className={styles.illustrationPlaceholder}>Иллюстрация появится позже</div>
          ) : null}
          <p className={`${styles.prompt} kr`}>1. {block.warmup.prompt}</p>
        </div>
      )}
      {block.group_prompt && <p className={`${styles.prompt} kr`}>2. {block.group_prompt}</p>}
      {block.questions.map((question, i) => {
        if (question.kind === "choice") return <ChoiceQuestion key={i} question={question} />;
        if (question.kind === "table") return <TableQuestion key={i} question={question} />;
        return <OpenQuestion key={i} question={question} />;
      })}
      {block.followup && <p className={`${styles.comprehensionQuestion} ${styles.prompt} kr`}>3. {block.followup}</p>}
      {block.exercise_kind === "listening" && (
        <span className={styles.note}>
          Послушайте аудио и обсудите вслух — ответы проверьте с преподавателем
        </span>
      )}
    </div>
  );
}
