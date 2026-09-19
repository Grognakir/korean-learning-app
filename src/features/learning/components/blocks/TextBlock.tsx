import type {
  HintBlock,
  TextBlock as TextBlockType,
  TextLine,
} from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { VocabChip } from "./VocabChip";
import { highlightVocab, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

function LineText({
  line,
  vocabItems,
}: {
  line: TextLine;
  vocabItems?: VocabItem[];
}) {
  return <span className={`${styles.lineText} kr`}>{highlightVocab(line.text, vocabItems)}</span>;
}

function HintSection({ hint }: { hint: HintBlock }) {
  const phrases = hint.items.filter((item) => item.kind === "phrase");
  const patterns = hint.items.filter((item) => item.kind === "pattern");

  if (phrases.length === 0 && patterns.length === 0) return null;

  return (
    <div className={styles.textHint}>
      {phrases.length > 0 && (
        <div className={styles.textHintGroup}>
          <span className={styles.labelRow}>
            <span className={`${styles.label} kr`}>표현</span>
            <LabelInfo translation="Выражения" />
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

export function TextBlock({
  block,
  id,
  vocabItems,
  relatedHint,
}: {
  block: TextBlockType;
  id?: string;
  vocabItems?: VocabItem[];
  relatedHint?: HintBlock;
}) {
  return (
    <div id={id} className={styles.block}>
      {block.title && (
        <span className={styles.labelRow}>
          <span className={`${styles.dialogueTitle} kr`}>{block.title}</span>
          {block.title_ru && <LabelInfo translation={block.title_ru} />}
        </span>
      )}
      {block.illustration?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.illustration.imageUrl}
          alt={block.title ?? ""}
          className={styles.illustrationImage}
        />
      )}
      {block.audioUrl && (
        <audio controls src={block.audioUrl} className={styles.audio} />
      )}
      {block.lines.map((line, i) => (
        <p key={i} className={styles.line}>
          {line.speaker && (
            <span className={`${styles.speaker} kr`}>{line.speaker}:</span>
          )}
          <LineText line={line} vocabItems={vocabItems} />
        </p>
      ))}
      {relatedHint && <HintSection hint={relatedHint} />}
    </div>
  );
}
