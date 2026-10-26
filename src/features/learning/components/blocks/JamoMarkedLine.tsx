import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

export function JamoMarkedLine({
  line,
  text,
  jamo,
  vocabItems,
  keyPrefix,
  seen,
  emphasized,
}: {
  line: string;
  text: string;
  jamo: string;
  vocabItems?: VocabItem[];
  keyPrefix: string;
  seen?: Set<string>;
  emphasized?: string[];
}) {
  const at = line.indexOf(text);
  if (at === -1) {
    return <>{highlightDialogueSpeakers(line, vocabItems, keyPrefix, seen, emphasized)}</>;
  }
  const end = at + text.length;
  return (
    <>
      {highlightDialogueSpeakers(line.slice(0, end), vocabItems, `${keyPrefix}b-`, seen, emphasized)}
      <span className={styles.jamoChip}>{jamo}</span>
      {highlightDialogueSpeakers(line.slice(end), vocabItems, `${keyPrefix}a-`, seen, emphasized)}
    </>
  );
}
