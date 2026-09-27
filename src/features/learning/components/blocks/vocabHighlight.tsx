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
    // 하다-глаголы/прилагательные стягивают 하+아/어→해 без исключений
    // (설명하다→설명해, 시작하다→시작해...) — в отличие от предыдущей
    // заготовки это не догадка, а формальное правило корейского.
    if (stem.endsWith("하")) {
      needles.push(`${stem.slice(0, -1)}해`);
    }
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

/** Размечает сложные слова и грамматическое выделение в тексте — общая
 * логика для текстов урока, грамматики и упражнений. `seen`, если передан,
 * собирает уже размеченные словарные формы (item.ko) между несколькими
 * вызовами подряд (например, по всем строкам одного упражнения) —
 * повторное появление того же слова рендерится обычным текстом, а не ещё
 * одним чипом с тем же переводом. `chipNested` — true, когда результат
 * встраивается внутрь уже кликабельного родителя (например пункта-кнопки
 * упражнения): чипы тогда рендерятся без вложенного <button> и с остановкой
 * всплытия клика, см. `VocabChip`. */
export function highlightDialogueSpeakers(
  text: string,
  vocabItems: VocabItem[] | undefined,
  keyPrefix = "",
  seen?: Set<string>,
  emphasized: string[] = [],
  emphasisClassName: string = styles.exerciseEmphasis,
  chipNested = false,
): ReactNode {
  // Грамматическое выделение (emphasis) и словарные чипы (vocab) — два
  // НЕЗАВИСИМЫХ набора диапазонов над одним текстом, и они могут
  // пересекаться посередине слова (например "자를 거예요": вокаб-слово
  // "자를" и emphasis-показатель "를 거예요" оба претендуют на "를").
  // Раньше текст сначала резался по границам emphasis, и вокаб-поиск
  // внутри каждого куска не мог найти слово, разорванное этой границей.
  // Здесь вместо этого считаем оба набора диапазонов на ЦЕЛОЙ строке,
  // режем по объединению всех границ и на каждый минимальный кусок
  // навешиваем оба стиля сразу, если применимо — а сегменты одного и
  // того же вокаб-совпадения группируем в один чип (иначе слово
  // распадётся на несколько кликабельных кусков).
  function renderText(value: string, partKey: string): ReactNode {
    const emphasisRanges = emphasized
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

    const vocabMatches = vocabItems?.length ? findVocabMatches(value, vocabItems) : [];

    if (emphasisRanges.length === 0 && vocabMatches.length === 0) {
      return value;
    }

    const boundarySet = new Set<number>([0, value.length]);
    for (const r of emphasisRanges) {
      boundarySet.add(r.start);
      boundarySet.add(r.end);
    }
    for (const m of vocabMatches) {
      boundarySet.add(m.start);
      boundarySet.add(m.end);
    }
    const boundaries = Array.from(boundarySet).sort((a, b) => a - b);

    type Segment = {
      start: number;
      end: number;
      emphasis: { start: number; end: number } | null;
      vocab: TextMatch | null;
    };
    const segments: Segment[] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const segStart = boundaries[i];
      const segEnd = boundaries[i + 1];
      if (segStart === segEnd) continue;
      const emphasis = emphasisRanges.find((r) => r.start <= segStart && segEnd <= r.end) ?? null;
      const vocab = vocabMatches.find((m) => m.start <= segStart && segEnd <= m.end) ?? null;
      segments.push({ start: segStart, end: segEnd, emphasis, vocab });
    }

    const nodes: ReactNode[] = [];
    let i = 0;
    while (i < segments.length) {
      const seg = segments[i];
      if (seg.vocab) {
        const vocabMatch = seg.vocab;
        const group: Segment[] = [];
        while (i < segments.length && segments[i].vocab === vocabMatch) {
          group.push(segments[i]);
          i++;
        }
        const chipChildren = group.map((g) => {
          const slice = value.slice(g.start, g.end);
          return g.emphasis ? (
            <span key={`${partKey}emph-${g.start}`} className={emphasisClassName}>
              {slice}
            </span>
          ) : (
            slice
          );
        });
        if (seen?.has(vocabMatch.ko)) {
          nodes.push(...chipChildren);
        } else {
          seen?.add(vocabMatch.ko);
          nodes.push(
            <VocabChip
              key={`${partKey}vocab-${vocabMatch.start}`}
              text={chipChildren}
              translation={vocabMatch.translation}
              className={styles.inlineVocab}
              nested={chipNested}
            />,
          );
        }
      } else {
        const slice = value.slice(seg.start, seg.end);
        nodes.push(
          seg.emphasis ? (
            <span key={`${partKey}emph-${seg.start}`} className={emphasisClassName}>
              {slice}
            </span>
          ) : (
            slice
          ),
        );
        i++;
      }
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
