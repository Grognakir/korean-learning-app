import type { WritingExerciseBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { Manuscript } from "./Manuscript";
import styles from "./blocks.module.css";

function splitPrompt(prompt: string) {
  const match = prompt.match(/^1\.\s*(.*?)\s+1\)\s*(.*?)\s+2\)\s*(.*)$/);

  if (!match) return null;

  return {
    task: match[1],
    outline: `1) ${match[2]}`,
    manuscript: `2) ${match[3]}`,
  };
}

export function WritingExercise({
  block,
  id,
}: {
  block: WritingExerciseBlock;
  id?: string;
}) {
  const prompt = splitPrompt(block.prompt);

  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
      </span>
      <div className={styles.writingInstructions}>
        <p className={`${styles.writingTask} kr`}>{prompt?.task ?? block.prompt}</p>
        {prompt && <p className={`${styles.writingStep} kr`}>{prompt.outline}</p>}
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
                  <textarea className={`${styles.writingOutlineAnswer} kr`} rows={3} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {prompt && <p className={`${styles.writingStep} kr`}>{prompt.manuscript}</p>}
      <Manuscript />
    </div>
  );
}
