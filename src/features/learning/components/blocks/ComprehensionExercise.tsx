"use client";

import type { ReactNode } from "react";
import type { ComprehensionExerciseBlock, ComprehensionQuestion, HintBlock } from "@/features/learning/types";
import { useDraft } from "@/lib/useDraft";
import { HintSection } from "./HintSection";
import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import { LabelInfo } from "./LabelInfo";
import { speakerClassName } from "./speakerClassName";
import styles from "./blocks.module.css";

function QuestionPrompt({
  question,
  promptNode,
}: {
  question: ComprehensionQuestion;
  promptNode: ReactNode;
}) {
  return (
    <p className={`${styles.prompt} kr`}>
      {promptNode}
      {question.prompt_ru && <LabelInfo translation={question.prompt_ru} />}
    </p>
  );
}

function ChoiceQuestion({
  question,
  promptNode,
  choiceNodes,
  draftKey,
}: {
  question: ComprehensionQuestion;
  promptNode: ReactNode;
  choiceNodes: ReactNode[];
  draftKey: string;
}) {
  const [stored, setStored] = useDraft(`${draftKey}:choice`);
  const picked = stored === "" ? NaN : Number(stored);
  const selected =
    Number.isInteger(picked) && picked >= 0 && picked < (question.choices?.length ?? 0)
      ? picked
      : null;
  const setSelected = (index: number) => setStored(String(index));
  const checkable = question.correct != null;

  return (
    <div className={styles.comprehensionQuestion}>
      <QuestionPrompt question={question} promptNode={promptNode} />
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
              <span>{choiceNodes[i] ?? choice}</span>
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

function TableCell({ draftKey }: { draftKey: string }) {
  const [value, setValue] = useDraft(draftKey);
  return (
    <input
      type="text"
      className={`${styles.comprehensionTableInput} kr`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function TableQuestion({
  question,
  promptNode,
  draftKey,
}: {
  question: ComprehensionQuestion;
  promptNode: ReactNode;
  draftKey: string;
}) {
  if (!question.table) return null;
  return (
    <div className={styles.comprehensionQuestion}>
      <QuestionPrompt question={question} promptNode={promptNode} />
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
                    <TableCell draftKey={`${draftKey}:r${i}c${j}`} />
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

function OpenQuestion({
  question,
  promptNode,
  draftKey,
}: {
  question: ComprehensionQuestion;
  promptNode: ReactNode;
  draftKey: string;
}) {
  const [value, setValue] = useDraft(draftKey);
  return (
    <div className={styles.comprehensionQuestion}>
      <QuestionPrompt question={question} promptNode={promptNode} />
      <input
        type="text"
        aria-label={question.prompt}
        placeholder="답을 입력하세요"
        className={`${styles.comprehensionAnswerInput} kr`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export function ComprehensionExercise({
  block,
  id,
  vocabItems,
  relatedHints,
  textbookSlug,
  lessonNumber,
}: {
  block: ComprehensionExerciseBlock;
  id?: string;
  textbookSlug?: string;
  lessonNumber?: number;
  vocabItems?: VocabItem[];
  relatedHints?: HintBlock[];
}) {
  // Одно слово переводится один раз на всё задание: сначала в тексте аудио,
  // дальше (вопросы, ответы) — обычным текстом.
  const seen = new Set<string>();
  const draftBase = `comprehension:${textbookSlug ?? "book"}:${lessonNumber ?? "lesson"}:${block.id ?? id ?? "exercise"}`;
  const taskText = (text: string, keyPrefix: string) =>
    highlightDialogueSpeakers(text, vocabItems, keyPrefix, seen);

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
            1. {taskText(block.warmup.prompt, "warmup-")}
            {block.warmup.prompt_ru && <LabelInfo translation={block.warmup.prompt_ru} />}
          </p>
        </div>
      )}
      {block.audioUrl && <audio controls src={block.audioUrl} className={styles.audio} />}
      {block.transcript && (
        <details className={`${styles.grammarDetails} ${styles.transcriptDetails}`}>
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
          <div className={styles.transcriptBody}>
            {block.transcript.lines.map((line, i) => (
              <p key={i} className={styles.line}>
                {line.speaker && (
                  <span className={`${speakerClassName(line.speaker)} kr`}>{line.speaker}:</span>
                )}
                <span className={`${styles.lineText} kr`}>
                  {highlightDialogueSpeakers(line.text, vocabItems, `tr-${i}-`, seen)}
                </span>
              </p>
            ))}
            {relatedHints?.map((hint, i) => <HintSection key={hint.id ?? i} hint={hint} />)}
          </div>
        </details>
      )}
      {!block.transcript && relatedHints?.map((hint, i) => <HintSection key={hint.id ?? i} hint={hint} />)}
      {block.group_prompt && (
        <p className={`${styles.prompt} kr`}>
          2. {taskText(block.group_prompt, "group-")}
          {block.group_prompt_ru && <LabelInfo translation={block.group_prompt_ru} />}
        </p>
      )}
      <div className={block.group_prompt ? styles.comprehensionSubItems : styles.comprehensionQuestions}>
      {block.questions.map((question, i) => {
        const promptNode = taskText(question.prompt, `q${i}-`);
        if (question.kind === "choice") {
          const choiceNodes = (question.choices ?? []).map((choice, j) =>
            highlightDialogueSpeakers(choice, vocabItems, `q${i}c${j}-`, seen, [], undefined, true),
          );
          return (
            <ChoiceQuestion
              key={i}
              question={question}
              promptNode={promptNode}
              choiceNodes={choiceNodes}
              draftKey={`${draftBase}:q${i}`}
            />
          );
        }
        if (question.kind === "table") {
          return <TableQuestion key={i} question={question} promptNode={promptNode} draftKey={`${draftBase}:q${i}`} />;
        }
        return (
          <OpenQuestion
            key={i}
            question={question}
            promptNode={promptNode}
            draftKey={`${draftBase}:q${i}`}
          />
        );
      })}
      </div>
      {block.followup && (
        <p className={`${styles.comprehensionFollowup} ${styles.prompt} kr`}>
          <span>
            3. {taskText(block.followup, "followup-")}
            {block.followup_ru && <LabelInfo translation={block.followup_ru} />}
          </span>
        </p>
      )}
    </div>
  );
}
