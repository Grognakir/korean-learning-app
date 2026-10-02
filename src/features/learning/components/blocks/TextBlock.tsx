import type {
  HintBlock,
  TextBlock as TextBlockType,
  TextLine,
} from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { VocabChip } from "./VocabChip";
import { OpenTemplateDialogue } from "./OpenTemplateDialogue";
import { speakerClassName } from "./speakerClassName";
import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

function LineText({
  line,
  vocabItems,
  seenVocab,
}: {
  line: TextLine;
  vocabItems?: VocabItem[];
  seenVocab: Set<string>;
}) {
  return (
    <span className={`${styles.lineText} kr`}>
      {highlightDialogueSpeakers(
        line.text,
        vocabItems,
        "",
        seenVocab,
        line.emphasized ?? [],
        styles.emphasized,
      )}
    </span>
  );
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
  titleSuffix,
}: {
  block: TextBlockType;
  id?: string;
  vocabItems?: VocabItem[];
  relatedHint?: HintBlock;
  /** См. GrammarExercise — тот же суффикс "-1"/"-2" для дополнительного
   * задания того же упражнения (exercise_title совпадает с соседним
   * grammar_exercise). */
  titleSuffix?: number | null;
}) {
  const seenVocab = new Set<string>();
  const isInvitation = block.text_kind === "invitation";

  return (
    <div id={id} className={styles.block}>
      {block.exercise_title && (
        <span className={styles.labelRow}>
          <span className={`${styles.label} kr`}>
            {block.exercise_title}
            {titleSuffix ? `-${titleSuffix}` : ""}
          </span>
        </span>
      )}
      {block.title && (
        <span className={styles.labelRow}>
          <span
            className={`${block.exercise_title ? styles.prompt : styles.dialogueTitle} ${isInvitation ? styles.invitationTitle : ""} kr`}
          >
            {block.title}
          </span>
          {block.title_ru && <LabelInfo translation={block.title_ru} />}
        </span>
      )}
      {block.intro_prompt && (
        <span className={styles.labelRow}>
          <span className={`${styles.prompt} kr`}>{block.intro_prompt}</span>
          {block.intro_prompt_ru && <LabelInfo translation={block.intro_prompt_ru} />}
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
      {block.practice_variants ? (
        <OpenTemplateDialogue lines={block.lines} count={block.practice_variants.count} />
      ) : (
        block.lines.map((line, i) => (
          <p
            key={i}
            className={
              isInvitation
                ? line.line_kind === "signature"
                  ? styles.invitationSignature
                  : line.line_kind === "list-item"
                    ? styles.invitationListItem
                    : styles.invitationParagraph
                : styles.line
            }
          >
            {line.speaker && (
              <span className={`${speakerClassName(line.speaker)} kr`}>{line.speaker}:</span>
            )}
            <LineText line={line} vocabItems={vocabItems} seenVocab={seenVocab} />
            {line.translation_ru && <LabelInfo translation={line.translation_ru} />}
          </p>
        ))
      )}
      {block.table && (
        <div className={styles.comprehensionTableWrap}>
          <table className={styles.comprehensionTable}>
            <thead>
              <tr>
                {block.table.columns.map((col, i) => (
                  <th key={i} className="kr">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {block.table.columns.map((_, colIndex) => (
                  <td key={colIndex} className="kr">
                    {block.table!.rows.map((row, rowIndex) => (
                      <p key={rowIndex}>{row[colIndex]}</p>
                    ))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {relatedHint && <HintSection hint={relatedHint} />}
    </div>
  );
}
