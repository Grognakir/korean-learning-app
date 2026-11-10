import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

export type JamoMark = { text: string; jamo: string };

export function renderJamoMarkedLine({
  line,
  marks,
  vocabItems,
  keyPrefix,
  seen,
  emphasized,
  emphasisClassName,
}: {
  line: string;
  marks: JamoMark[];
  vocabItems?: VocabItem[];
  keyPrefix: string;
  seen?: Set<string>;
  emphasized?: string[];
  emphasisClassName?: string;
}) {
  const parts: { text: string; jamo?: string }[] = [];
  let from = 0;
  for (const mark of marks) {
    const at = line.indexOf(mark.text, from);
    if (at === -1) continue;
    const end = at + mark.text.length;
    parts.push({ text: line.slice(from, end), jamo: mark.jamo });
    from = end;
  }
  parts.push({ text: line.slice(from) });
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part.text &&
            highlightDialogueSpeakers(
              part.text,
              vocabItems,
              `${keyPrefix}${i}-`,
              seen,
              emphasized,
              emphasisClassName,
            )}
          {part.jamo && <span className={styles.jamoChip}>{part.jamo}</span>}
        </span>
      ))}
    </>
  );
}
