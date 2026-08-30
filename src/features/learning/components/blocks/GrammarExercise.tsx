import type { GrammarExerciseBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function GrammarExercise({
  block,
  id,
}: {
  block: GrammarExerciseBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={`${styles.label} kr`}>{block.exercise_title}</span>
      <span className={`${styles.prompt} kr`}>{block.prompt}</span>
      <div className={styles.exerciseDialogue}>
        {block.example.dialogue.map((line, i) => (
          <p key={i} className="kr">
            {line}
          </p>
        ))}
      </div>
      <div className={styles.exerciseItems}>
        {block.items.map((item, i) => (
          <span key={i} className={`${styles.exerciseItem} kr`}>
            {item.given.join(" / ")}
          </span>
        ))}
      </div>
    </div>
  );
}
