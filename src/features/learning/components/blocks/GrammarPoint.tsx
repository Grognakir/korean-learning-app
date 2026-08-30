import type { GrammarPointBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function GrammarPoint({
  block,
  id,
}: {
  block: GrammarPointBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={styles.label}>Грамматика {block.section}</span>
      <span className={`${styles.pattern} kr`}>{block.pattern}</span>
      {block.explanation && <p>{block.explanation}</p>}
      <div className={styles.examples}>
        {block.examples.map((example, i) => (
          <p key={i} className={`${styles.example} kr`}>
            {example}
          </p>
        ))}
      </div>
    </div>
  );
}
