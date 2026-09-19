import type { PronunciationBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function Pronunciation({
  block,
  id,
}: {
  block: PronunciationBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>발음</span>
      </span>
      <span className={`${styles.pattern} kr`}>{block.rule}</span>
      {block.audioUrl && <audio controls src={block.audioUrl} className={styles.audio} />}
      <div className={styles.vocabItems}>
        {block.examples.map((example, i) => (
          <span key={i} className={`${styles.vocabKo} kr`}>
            {example}
          </span>
        ))}
      </div>
    </div>
  );
}
