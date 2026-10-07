"use client";

import { useState } from "react";
import type { ComprehensionExerciseBlock, ComprehensionQuestion } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { speakerClassName } from "./speakerClassName";
import styles from "./blocks.module.css";

function QuestionPrompt({ question }: { question: ComprehensionQuestion }) {
  return (
    <p className={`${styles.prompt} kr`}>
      {question.prompt}
      {question.prompt_ru && <LabelInfo translation={question.prompt_ru} />}
    </p>
  );
}

function ChoiceQuestion({ question }: { question: ComprehensionQuestion }) {
  const [selected, setSelected] = useState<number | null>(null);
  const checkable = question.correct != null;

  return (
    <div className={styles.comprehensionQuestion}>
      <QuestionPrompt question={question} />
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
      <QuestionPrompt question={question} />
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
      <QuestionPrompt question={question} />
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
        {block.title_ru && <LabelInfo translation={block.title_ru} />}
      </span>
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
          <p className={`${styles.prompt} kr`}>
            1. {block.warmup.prompt}
            {block.warmup.prompt_ru && <LabelInfo translation={block.warmup.prompt_ru} />}
          </p>
        </div>
      )}
      {block.audioUrl && <audio controls src={block.audioUrl} className={styles.audio} />}
      {block.transcript && (
        <details className={styles.grammarDetails}>
          <summary className={`${styles.grammarSummary} ${styles.grammarSummaryCompact}`}>
            <span className={`${styles.transcriptTitle} kr`}>듣기 지문</span>
            <svg className={styles.grammarToggleIcon} viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M6 3l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className={styles.grammarNote}>
            {block.transcript.lines.map((line, i) => (
              <p key={i} className={styles.line}>
                {line.speaker && (
                  <span className={`${speakerClassName(line.speaker)} kr`}>{line.speaker}:</span>
                )}
                <span className={`${styles.lineText} kr`}>{line.text}</span>
              </p>
            ))}
          </div>
        </details>
      )}
      {block.group_prompt && (
        <p className={`${styles.prompt} kr`}>
          2. {block.group_prompt}
          {block.group_prompt_ru && <LabelInfo translation={block.group_prompt_ru} />}
        </p>
      )}
      {block.questions.map((question, i) => {
        if (question.kind === "choice") return <ChoiceQuestion key={i} question={question} />;
        if (question.kind === "table") return <TableQuestion key={i} question={question} />;
        return <OpenQuestion key={i} question={question} />;
      })}
      {block.followup && (
        <p className={`${styles.comprehensionFollowup} ${styles.prompt} kr`}>
          3. {block.followup}
          {block.followup_ru && <LabelInfo translation={block.followup_ru} />}
        </p>
      )}
    </div>
  );
}
