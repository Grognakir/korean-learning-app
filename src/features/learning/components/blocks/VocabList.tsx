import type { VocabListBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function VocabList({
  block,
  id,
}: {
  block: VocabListBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={`${styles.label} kr`}>{block.title}</span>
      <div className={styles.vocabItems}>
        {block.items.map((item, i) => (
          <div key={`${item.ko}-${i}`} className={styles.vocabItem}>
            <button type="button" className={`${styles.vocabKo} kr`}>
              {item.ko}
            </button>
            <span className={styles.vocabTranslation} role="tooltip">
              {item.translation_ru}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
