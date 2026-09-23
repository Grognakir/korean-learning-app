import type { ReactNode } from "react";
import { VocabChip } from "./VocabChip";
import styles from "./blocks.module.css";

export type VocabItem = { ko: string; translation_ru: string };

type TextMatch = { start: number; end: number; translation: string; ko: string };

function vocabNeedles(ko: string): string[] {
  const needles = [ko];
  if (ko.endsWith("다") && ko.length > 1) {
    const stem = ko.slice(0, -1);
    needles.push(stem);
    // Многие глагольные/прилагательные основы на гласную (지내다→지내요,
    // 가다→가요) в 해요체 просто добавляют 요 без изменения основы — если
    // это не тот случай (например, стяжение 마시다→마셔요), эта заготовка
    // просто ни с чем не совпадёт в тексте, не давая ложных срабатываний.
    needles.push(`${stem}요`);
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
          ko: item.ko,
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

export function vocabKeysInText(text: string, vocabItems: VocabItem[]): string[] {
  return findVocabMatches(text, vocabItems).map((match) => match.ko);
}

/** Размечает сложные слова в тексте кликабельными чипами с переводом по
 * наведению — общая логика для текстов урока, грамматики и упражнений.
 * `seen`, если передан, собирает уже размеченные словарные формы (item.ko)
 * между несколькими вызовами подряд (например, по всем строкам одного
 * упражнения) — повторное появление того же слова рендерится обычным
 * текстом, а не ещё одним чипом с тем же переводом. */
export function highlightVocab(
  text: string,
  vocabItems: VocabItem[] | undefined,
  keyPrefix = "",
  seen?: Set<string>,
): ReactNode {
  if (!vocabItems?.length) return text;

  const matches = findVocabMatches(text, vocabItems);
  if (matches.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, i) => {
    if (match.start > cursor) {
      parts.push(text.slice(cursor, match.start));
    }
    if (seen?.has(match.ko)) {
      parts.push(text.slice(match.start, match.end));
    } else {
      seen?.add(match.ko);
      parts.push(
        <VocabChip
          key={`${keyPrefix}${match.start}-${i}`}
          text={text.slice(match.start, match.end)}
          translation={match.translation}
          className={styles.inlineVocab}
        />,
      );
    }
    cursor = match.end;
  });
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

export function highlightDialogueSpeakers(
  text: string,
  vocabItems: VocabItem[] | undefined,
  keyPrefix = "",
  seen?: Set<string>,
  emphasized: string[] = [],
  emphasisClassName: string = styles.exerciseEmphasis,
): ReactNode {
  function renderText(value: string, partKey: string): ReactNode {
    const fragments = emphasized
      .flatMap((fragment) => {
        const ranges: { start: number; end: number }[] = [];
        let from = 0;
        while (fragment && from < value.length) {
          const start = value.indexOf(fragment, from);
          if (start === -1) break;
          ranges.push({ start, end: start + fragment.length });
          from = start + fragment.length;
        }
        return ranges;
      })
      .sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
      .filter(
        (range, index, ranges) =>
          !ranges.slice(0, index).some((taken) => range.start < taken.end && range.end > taken.start),
      );

    if (fragments.length === 0) {
      return highlightVocab(value, vocabItems, partKey, seen);
    }

    const nodes: ReactNode[] = [];
    let position = 0;
    fragments.forEach((range, index) => {
      if (range.start > position) {
        nodes.push(
          highlightVocab(value.slice(position, range.start), vocabItems, `${partKey}plain-${index}-`, seen),
        );
      }
      nodes.push(
        <span key={`${partKey}emphasis-${range.start}`} className={emphasisClassName}>
          {highlightVocab(
            value.slice(range.start, range.end),
            vocabItems,
            `${partKey}emphasis-${index}-`,
            seen,
          )}
        </span>,
      );
      position = range.end;
    });
    if (position < value.length) {
      nodes.push(highlightVocab(value.slice(position), vocabItems, `${partKey}tail-`, seen));
    }
    return nodes;
  }

  const parts: ReactNode[] = [];
  const speakerPattern = /(^|\n)([가나]:)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = speakerPattern.exec(text))) {
    if (match.index > cursor) {
      parts.push(
        renderText(text.slice(cursor, match.index), `${keyPrefix}text-${partIndex++}-`),
      );
    }
    if (match[1]) parts.push(match[1]);
    parts.push(
      <span
        key={`${keyPrefix}speaker-${match.index}`}
        className={match[2][0] === "가" ? styles.dialogueSpeakerA : styles.dialogueSpeakerB}
      >
        {match[2]}
      </span>,
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    parts.push(
      renderText(text.slice(cursor), `${keyPrefix}text-${partIndex}-`),
    );
  }

  return parts.length > 0 ? parts : renderText(text, keyPrefix);
}
