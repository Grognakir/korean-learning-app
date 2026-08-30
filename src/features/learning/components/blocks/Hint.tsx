import type { HintBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function Hint({ block, id }: { block: HintBlock; id?: string }) {
  return (
    <div id={id} className={styles.block}>
      <div className={styles.vocabItems}>
        {block.items.map((item) => (
          <span key={item.text} className={styles.vocabItem}>
            <button type="button" className={`${styles.vocabKo} kr`}>
              {item.text}
            </button>
            <span className={styles.vocabTranslation} role="tooltip">
              {item.translation_ru}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
