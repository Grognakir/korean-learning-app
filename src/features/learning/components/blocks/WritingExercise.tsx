"use client";

import { useDraft } from "@/lib/useDraft";
import type { WritingExerciseBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { Manuscript } from "./Manuscript";
import styles from "./blocks.module.css";

export function WritingExercise({
  block,
  id,
  textbookSlug,
  lessonNumber,
}: {
  block: WritingExerciseBlock;
  id?: string;
  textbookSlug?: string;
  lessonNumber?: number;
}) {
  const draftKey = `writing:${textbookSlug ?? "book"}:${lessonNumber ?? "lesson"}:${block.id ?? id ?? "writing"}`;
  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
        {block.title_ru && <LabelInfo translation={block.title_ru} />}
      </span>
      <div className={styles.writingInstructions}>
        <p className={`${styles.writingStep} kr`}>
          {block.outline_prompt}
          {block.outline_prompt_ru && <LabelInfo translation={block.outline_prompt_ru} />}
        </p>
      </div>
      <div className={`${styles.comprehensionTableWrap} ${styles.writingOutlineWrap}`}>
        <table className={`${styles.comprehensionTable} ${styles.writingOutlineTable}`}>
          <colgroup>
            <col className={styles.writingOutlineStageColumn} />
            <col className={styles.writingOutlineQuestionColumn} />
            <col className={styles.writingOutlineAnswerColumn} />
          </colgroup>
          <thead>
            <tr>
              <th className="kr" colSpan={3}>개요</th>
            </tr>
          </thead>
          <tbody>
            {block.outline.map((stage, i) => (
              <tr key={i}>
                <td className={styles.writingOutlineCell}>
                  <span className={`${styles.writingOutlineStageLabel} kr`}>{stage.stage}</span>
                </td>
                <td className={styles.writingOutlineCell}>
                  <span className={styles.writingOutlineQuestions}>
                    {stage.questions.map((q, j) => (
                      <span key={j} className={styles.writingOutlineQuestion}>
                        <span className={`${styles.writingOutlineQuestionText} kr`}>{q.kr}</span>
                        <LabelInfo translation={q.ru} />
                      </span>
                    ))}
                  </span>
                </td>
                <td className={styles.writingOutlineAnswerCell}>
                  <OutlineAnswer storageKey={`${draftKey}:outline:${i}`} label={stage.questions.map((q) => q.kr).join(" ")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`${styles.writingStep} kr`}>
        {block.manuscript_prompt}
        {block.manuscript_prompt_ru && <LabelInfo translation={block.manuscript_prompt_ru} />}
      </p>
      <Manuscript storageKey={`${draftKey}:essay`} />
    </div>
  );
}

function OutlineAnswer({ storageKey, label }: { storageKey: string; label: string }) {
  const [value, setValue] = useDraft(storageKey);
  return <textarea aria-label={label} className={`${styles.writingOutlineAnswer} kr`} rows={3} value={value} onChange={(e) => setValue(e.target.value)} />;
}
