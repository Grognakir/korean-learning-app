import type { HintBlock } from "@/features/learning/types";
import { VocabChip } from "./VocabChip";
import styles from "./blocks.module.css";

export function Hint({ block, id }: { block: HintBlock; id?: string }) {
  return (
    <div id={id} className={styles.block}>
      <div className={styles.vocabItems}>
        {block.items.map((item) => (
          <VocabChip key={item.text} text={item.text} translation={item.translation_ru} />
        ))}
      </div>
    </div>
  );
}
