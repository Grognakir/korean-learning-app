import type { VocabListBlock } from "@/features/learning/types";
import { LabelTranslation } from "./LabelTranslation";
import { VocabChip } from "./VocabChip";
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
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
        {block.title_ru && <LabelTranslation translation={block.title_ru} />}
      </span>
      <div className={styles.vocabItems}>
        {block.items.map((item, i) => (
          <VocabChip key={`${item.ko}-${i}`} text={item.ko} translation={item.translation_ru} />
        ))}
      </div>
    </div>
  );
}
