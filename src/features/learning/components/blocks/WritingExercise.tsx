import type { WritingExerciseBlock } from "@/features/learning/types";
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
        <table className={styles.comprehensionTable}>
          <thead>
            <tr>
              <th colSpan={2} className="kr">
                개요
              </th>
            </tr>
          </thead>
          <tbody>
            {block.outline.map((stage, i) => (
              <tr key={i}>
                <th className="kr">{stage.stage}</th>
                <td className={styles.writingOutlineCell}>
                  <span className={styles.writingOutlineQuestions}>
                    {stage.questions.map((q, j) => (
                      <span key={j} className="kr">
                        {q}
                      </span>
                    ))}
                  </span>
                  <input type="text" className={`${styles.comprehensionTableInput} kr`} />
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
