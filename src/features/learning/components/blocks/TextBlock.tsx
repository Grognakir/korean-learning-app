import type { ReactNode } from "react";
import type {
  HintBlock,
  TextBlock as TextBlockType,
  TextLine,
} from "@/features/learning/types";
import styles from "./blocks.module.css";

type VocabItem = { ko: string; translation_ru: string };

type TextMatch = {
  start: number;
  end: number;
  translation: string;
};

function vocabNeedles(ko: string): string[] {
  const needles = [ko];
  if (ko.endsWith("다") && ko.length > 1) {
    needles.push(ko.slice(0, -1));
  }
  return needles.sort((a, b) => b.length - a.length);
}

function findVocabMatches(text: string, vocabItems: VocabItem[]): TextMatch[] {
  const candidates: TextMatch[] = [];

  for (const item of vocabItems) {
    for (const needle of vocabNeedles(item.ko)) {
      let from = 0;
      while (from < text.length) {
        const start = text.indexOf(needle, from);
        if (start === -1) break;
        candidates.push({
          start,
          end: start + needle.length,
          translation: item.translation_ru,
        });
        from = start + 1;
      }
    }
  }

  candidates.sort(
    (a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start,
  );

  const selected: TextMatch[] = [];
  for (const candidate of candidates) {
    const overlaps = selected.some(
      (taken) => candidate.start < taken.end && candidate.end > taken.start,
    );
    if (!overlaps) selected.push(candidate);
  }

  return selected.sort((a, b) => a.start - b.start);
}

function VocabChip({
  text,
  translation,
  className,
}: {
  text: string;
  translation: string;
  className?: string;
}) {
  return (
    <span className={`${styles.vocabItem} ${className ?? ""}`}>
      <button type="button" className={`${styles.vocabKo} kr`}>
        {text}
      </button>
      <span className={styles.vocabTranslation} role="tooltip">
        {translation}
      </span>
    </span>
  );
}

function LineText({
  line,
  vocabItems,
}: {
  line: TextLine;
  vocabItems?: VocabItem[];
}) {
  if (!vocabItems?.length) {
    return <span className={`${styles.lineText} kr`}>{line.text}</span>;
  }

  const matches = findVocabMatches(line.text, vocabItems);
  if (matches.length === 0) {
    return <span className={`${styles.lineText} kr`}>{line.text}</span>;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, i) => {
    if (match.start > cursor) {
      parts.push(line.text.slice(cursor, match.start));
    }
    parts.push(
      <VocabChip
        key={`${match.start}-${i}`}
        text={line.text.slice(match.start, match.end)}
        translation={match.translation}
        className={styles.inlineVocab}
      />,
    );
    cursor = match.end;
  });
  if (cursor < line.text.length) {
    parts.push(line.text.slice(cursor));
  }

  return <span className={`${styles.lineText} kr`}>{parts}</span>;
}

function HintSection({ hint }: { hint: HintBlock }) {
  const phrases = hint.items.filter((item) => item.kind === "phrase");
  const patterns = hint.items.filter((item) => item.kind === "pattern");

  if (phrases.length === 0 && patterns.length === 0) return null;

  return (
    <div className={styles.textHint}>
      {phrases.length > 0 && (
        <div className={styles.textHintGroup}>
          <span className={styles.label}>Готовые выражения</span>
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
          <span className={styles.label}>Конструкции</span>
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
        <span className={`${styles.label} kr`}>{block.title}</span>
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
