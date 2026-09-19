"use client";

import { useEffect, useMemo, useState } from "react";
import type { GrammarExerciseBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

type Segment = { kind: "text"; text: string } | { kind: "blank"; index: number };

const PROMPT_TRANSLATION =
  "Попробовать проговорить примеры и для всех вариантов правильно заполнить по образцу на корейском";

const EXAMPLE_EMPHASIS_FALLBACK: Record<string, string[][]> = {
  "가: 지금 무엇을 해요?\n나: 이메일을 쓰는 중이에요.": [["지금 무엇을 해요"], ["는 중이에요"]],
  "가: 언제 빵을 샀어요?\n나: 학교에 가는 중에 빵을 샀어요.": [
    ["언제", "어요"],
    ["는 중에", "어요"],
  ],
  "가: 뭐 하는 중이에요?\n나: 책을 읽는 중입니다. / 독서 중입니다.": [
    ["뭐 하는 중이에요"],
    ["는 중입니다", "중입니다"],
  ],
  "가: 언제 신문을 봐요?\n나: 차를 마실 때 신문을 봐요.": [
    ["언제", "요"],
    ["때", "요"],
  ],
  "가: 언제 부산에 갔어요?\n나: 방학 때 부산에 갔어요.": [
    ["언제", "어요"],
    ["때", "어요"],
  ],
  "가: 어느 과일이 더 좋아요?\n나: 수박에 비해서 사과가 더 좋아요.": [
    ["이", "더", "아요"],
    ["에 비해서", "가", "더", "아요"],
  ],
  "가: 물건 값이 싸요?\n나: 네, 품질에 비해 물건 값이 싸요.": [
    ["요"],
    ["네,", "에 비해", "요"],
  ],
  "가: 언제 약을 먹어요?\n나: 밥을 먹은 다음에 약을 먹어요.": [
    ["언제", "어요"],
    ["은 다음에", "어요"],
  ],
  "가: 언제부터 그 노래를 좋아하게 되었어요?\n나: 드라마를 본 후부터 그 노래를 좋아하게 되었어요.": [
    ["언제부터", "게 되었어요"],
    ["후부터", "게 되었어요"],
  ],
};

// Шаблон вида "가: {0}으니까 {1}게 {2}하세요." — явные позиции пропусков,
// без поиска словарной формы по уже проспрягованному тексту (см. историю
// правок: искать given-строку подстрокой в example.dialogue ломалось на
// любом спряжении — "작다" не находится в "작으니까").
function parseTemplate(template: string[]): Segment[][] {
  return template.map((line) => {
    const segments: Segment[] = [];
    const re = /\{(\d+)\}/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line))) {
      if (match.index > last) {
        segments.push({ kind: "text", text: line.slice(last, match.index) });
      }
      segments.push({ kind: "blank", index: Number(match[1]) });
      last = match.index + match[0].length;
    }
    if (last < line.length) segments.push({ kind: "text", text: line.slice(last) });
    return segments;
  });
}

function storageKey(blockId?: string) {
  return blockId ? `grammar-exercise:${blockId}` : null;
}

function inputWidthEm(value: string): number {
  const units = Array.from(value).reduce((total, char) => {
    if (/\s/.test(char)) return total + 0.35;
    if (char.charCodeAt(0) < 128) return total + 0.6;
    return total + 1;
  }, 0);
  return Math.max(units, 3);
}

function cueLines(cues: string[] | undefined, given: string[], expandPair: boolean): string[] {
  if (cues?.length) return cues;
  if (expandPair && given.length === 2) return [given[1], given.join(" / ")];
  return [given.join(" / ")];
}

type SavedState = { inputs: Record<number, string[]>; checked: Record<number, boolean> };

export function GrammarExercise({
  block,
  id,
  vocabItems,
}: {
  block: GrammarExerciseBlock;
  id?: string;
  vocabItems?: VocabItem[];
}) {
  const lines = useMemo(() => parseTemplate(block.template), [block.template]);
  const blankIndexes = useMemo(
    () => new Set(lines.flatMap((line) => line.flatMap((segment) => (segment.kind === "blank" ? [segment.index] : [])))),
    [lines],
  );
  const expandPairCues = blankIndexes.size === 2 && !block.template.some((line) => line.includes(" / "));
  const exampleEmphasis =
    block.example.emphasis ?? EXAMPLE_EMPHASIS_FALLBACK[block.example.dialogue.join("\n")];
  const key = storageKey(block.id);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [inputs, setInputs] = useState<Record<number, string[]>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // Ответы переживают переход на другой раздел/урок и обратно — иначе при
  // появлении «Следующий раздел» их будет ощутимо чаще терять. localStorage
  // недоступен при серверном рендере, поэтому восстановление возможно
  // только после монтирования — отсюда setState прямо в эффекте.
  useEffect(() => {
    if (!key) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInputs(saved.inputs ?? {});
        setChecked(saved.checked ?? {});
      }
    } catch {
      // приватный режим/квота — тренажёр просто не восстановит прошлый ввод
    }
  }, [key]);

  function persist(nextInputs: Record<number, string[]>, nextChecked: Record<number, boolean>) {
    if (!key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify({ inputs: nextInputs, checked: nextChecked }));
    } catch {
      // см. комментарий выше
    }
  }

  function targetsFor(itemIndex: number): string[] {
    return block.items[itemIndex].answers;
  }

  function isCorrect(itemIndex: number): boolean {
    const values = inputs[itemIndex];
    const targets = targetsFor(itemIndex);
    if (!values) return false;
    return values.every((v, i) => v.trim() === targets[i]?.trim());
  }

  function selectItem(itemIndex: number) {
    setActiveIndex(itemIndex);
    setInputs((prev) => {
      if (prev[itemIndex]) return prev;
      const next = { ...prev, [itemIndex]: Array(targetsFor(itemIndex).length).fill("") };
      persist(next, checked);
      return next;
    });
  }

  function updateBlank(itemIndex: number, blankIndex: number, value: string) {
    setInputs((prev) => {
      const current = prev[itemIndex] ?? Array(targetsFor(itemIndex).length).fill("");
      const nextValues = [...current];
      nextValues[blankIndex] = value;
      const next = { ...prev, [itemIndex]: nextValues };
      // Правки после проверки — снова «непроверено», пока не нажмут «Проверить».
      setChecked((prevChecked) => {
        if (!prevChecked[itemIndex]) return prevChecked;
        const nextC = { ...prevChecked, [itemIndex]: false };
        persist(next, nextC);
        return nextC;
      });
      return next;
    });
  }

  function checkItem(itemIndex: number) {
    setChecked((prev) => {
      const next = { ...prev, [itemIndex]: true };
      persist(inputs, next);
      return next;
    });
  }

  const activeValues = activeIndex !== null ? (inputs[activeIndex] ?? []) : [];
  const activeTargets = activeIndex !== null ? targetsFor(activeIndex) : [];
  const isChecked = activeIndex !== null && Boolean(checked[activeIndex]);
  const activeCorrect = activeIndex !== null && isCorrect(activeIndex);
  const blankStatus = !isChecked ? "neutral" : activeCorrect ? "correct" : "incorrect";
  const blankClass =
    blankStatus === "correct"
      ? styles.blankCorrect
      : blankStatus === "incorrect"
        ? styles.blankIncorrect
        : styles.blank;

  // Одно и то же слово в рамках одного упражнения (обычно встречается и в
  // "가:", и в "나:") переводим только при первом появлении — повтор просто
  // не добавляется в набор и рендерится обычным текстом.
  const seenVocab = new Set<string>();

  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.exercise_title}</span>
      </span>
      <span className={styles.labelRow}>
        <span className={`${styles.prompt} kr`}>{block.prompt}</span>
        <LabelInfo translation={PROMPT_TRANSLATION} />
      </span>

      <div className={styles.exerciseDialogue}>
        <span className={styles.exerciseDialogueLabel}>Пример</span>
        <div className={styles.exerciseCues}>
          {cueLines(block.example.cues, block.example.given, expandPairCues).map((cue, i) => (
            <p key={i} className="kr">
              {cue}
            </p>
          ))}
        </div>
        {block.example.dialogue.map((line, i) => (
          <p key={i} className="kr">
            {highlightDialogueSpeakers(
              line,
              vocabItems,
              `ex-${i}-`,
              seenVocab,
              exampleEmphasis?.[i],
            )}
          </p>
        ))}

        {activeIndex !== null && (
          <div className={styles.exerciseAttempt}>
            <span className={styles.exerciseDialogueLabel}>Заполните пропуски</span>
            {lines.map((segments, i) => (
              <p key={i} className="kr">
                {segments.map((segment, j) =>
                  segment.kind === "text" ? (
                    <span key={j} className={styles.exerciseFixed}>
                      {highlightDialogueSpeakers(
                        segment.text,
                        vocabItems,
                        `ln-${i}-${j}-`,
                        seenVocab,
                      )}
                    </span>
                  ) : (
                    <input
                      key={j}
                      className={`${blankClass} kr`}
                      style={{
                        width: `calc(${inputWidthEm(activeValues[segment.index] ?? "")}em + 14px)`,
                      }}
                      value={activeValues[segment.index] ?? ""}
                      onChange={(e) => updateBlank(activeIndex!, segment.index, e.target.value)}
                    />
                  ),
                )}
              </p>
            ))}

            {isChecked && (
              <p className={activeCorrect ? styles.exerciseResultCorrect : styles.exerciseResultIncorrect}>
                {activeCorrect ? "✓ Верно!" : <>✕ Неверно. Правильный ответ: {activeTargets.join(", ")}</>}
              </p>
            )}

            <div className={styles.exerciseDialogueActions}>
              <button
                type="button"
                className={styles.exerciseCheckButton}
                onClick={() => checkItem(activeIndex)}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3 8.5l3 3 7-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Проверить
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.exerciseItems}>
        {block.items.map((item, i) => {
          const itemChecked = Boolean(checked[i]);
          const itemCorrect = itemChecked && isCorrect(i);
          const statusCls = !itemChecked
            ? styles.exerciseItem
            : itemCorrect
              ? styles.exerciseItemCorrect
              : styles.exerciseItemIncorrect;
          return (
            <button
              key={i}
              type="button"
              className={`${statusCls} ${i === activeIndex ? styles.exerciseItemActive : ""} kr`}
              onClick={() => selectItem(i)}
            >
              <span className={styles.exerciseItemNumber} aria-hidden="true">
                {i + 1}
              </span>
              <span>{item.given.join(" / ")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
