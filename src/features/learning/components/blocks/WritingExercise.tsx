import type { WritingExerciseBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { Manuscript } from "./Manuscript";
import styles from "./blocks.module.css";

export function WritingExercise({
  block,
  id,
}: {
  block: WritingExerciseBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
      </span>
      <p className={`${styles.prompt} kr`}>{block.prompt}</p>
      <div className={styles.comprehensionTableWrap}>
        <table className={`${styles.comprehensionTable} ${styles.writingOutlineTable}`}>
          <thead>
            <tr>
              <th className="kr">단락</th>
              <th className="kr">질문</th>
              <th className="kr">나의 답변</th>
            </tr>
          </thead>
          <tbody>
            {block.outline.map((stage, i) => (
              <tr key={i}>
                <td className={styles.writingOutlineCell}>
                  <span className={`${styles.writingOutlineStageLabel} kr`}>{stage.stage}</span>
                  <span className={styles.writingOutlineExplanation}>{stage.explanation}</span>
                </td>
                <td className={styles.writingOutlineCell}>
                  <span className={styles.writingOutlineQuestions}>
                    {stage.questions.map((q, j) => (
                      <span key={j} className={styles.writingOutlineQuestion}>
                        <span className="kr">{q.kr}</span>
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
      <Manuscript />
    </div>
  );
}
