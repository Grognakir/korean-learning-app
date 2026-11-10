import type { HintBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { VocabChip } from "./VocabChip";
import styles from "./blocks.module.css";

export function HintSection({ hint }: { hint: HintBlock }) {
  const phrases = hint.items.filter((item) => item.kind === "phrase");
  const patterns = hint.items.filter((item) => item.kind === "pattern");

  if (phrases.length === 0 && patterns.length === 0) return null;

  return (
    <div className={styles.textHint}>
      {phrases.length > 0 && (
        <div className={styles.textHintGroup}>
          <span className={styles.labelRow}>
            <span className={`${styles.label} kr`}>{hint.label_ko ?? "표현"}</span>
            <LabelInfo translation={hint.label_ru ?? "Выражения"} />
          </span>
          <div className={styles.vocabItems}>
            {phrases.map((item) => (
              <VocabChip
                key={item.text}
                text={item.text}
                translation={item.translation_ru}
              />
            ))}
          </div>
        </div>
      )}
      {patterns.length > 0 && (
        <div className={styles.textHintGroup}>
          <span className={styles.labelRow}>
            <span className={`${styles.label} kr`}>문형</span>
            <LabelInfo translation="Конструкции" />
          </span>
          <div className={styles.vocabItems}>
            {patterns.map((item) => (
              <VocabChip
                key={item.text}
                text={item.text}
                translation={item.translation_ru}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
