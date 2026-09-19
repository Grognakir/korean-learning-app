import type { VocabListBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { VocabChip } from "./VocabChip";
import styles from "./blocks.module.css";

// "단어" — общее название блока со словами, как "Грамматика"/"Упражнение",
// перевод ему не нужен. Особые именованные подборки (например "전공") —
// перевод есть, но скрыт за иконкой, как у любого учебного текста.
const GENERIC_TITLE = "단어";

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
        {block.title_ru && block.title !== GENERIC_TITLE && (
          <LabelInfo translation={block.title_ru} />
        )}
      </span>
      <div className={styles.vocabItems}>
        {block.items.map((item, i) => (
          <VocabChip key={`${item.ko}-${i}`} text={item.ko} translation={item.translation_ru} />
        ))}
      </div>
    </div>
  );
}
