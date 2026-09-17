"use client";

import { useEffect, useMemo, useState } from "react";
import type { GrammarExerciseBlock } from "@/features/learning/types";
import { LabelTranslation } from "./LabelTranslation";
import styles from "./blocks.module.css";

type Segment = { kind: "text"; text: string } | { kind: "blank"; index: number };

function exerciseTranslation(exerciseTitle: string): string {
  const numbers = [...exerciseTitle.matchAll(/\d+/g)].map((m) => m[0]);
  return numbers.length ? `Упражнение ${numbers.join(", ")}` : "Упражнение";
}

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

type SavedState = { inputs: Record<number, string[]>; checked: Record<number, boolean> };

export function GrammarExercise({
  block,
  id,
}: {
  block: GrammarExerciseBlock;
  id?: string;
}) {
  const lines = useMemo(() => parseTemplate(block.template), [block.template]);
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

  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.exercise_title}</span>
        <LabelTranslation translation={exerciseTranslation(block.exercise_title)} />
      </span>
      <p className={styles.exerciseHint}>Выберите вариант и заполните пропуски по образцу.</p>
      <span className={`${styles.prompt} kr`}>{block.prompt}</span>

      <div className={styles.exerciseDialogue}>
        <span className={styles.exerciseDialogueLabel}>
          {activeIndex === null ? "Пример" : "Заполните пропуски"}
        </span>
        {activeIndex === null
          ? block.example.dialogue.map((line, i) => (
              <p key={i} className="kr">
                {line}
              </p>
            ))
          : lines.map((segments, i) => (
              <p key={i} className="kr">
                {segments.map((segment, j) =>
                  segment.kind === "text" ? (
                    <span key={j}>{segment.text}</span>
                  ) : (
                    <input
                      key={j}
                      className={`${blankClass} kr`}
                      style={{
                        // em, не ch: корейский полноширинный глиф ближе к 1em,
                        // чем к ch (ширине "0"), иначе текст обрезается.
                        width: `${Math.max(activeTargets[segment.index]?.length ?? 1, 1) + 1}em`,
                      }}
                      value={activeValues[segment.index] ?? ""}
                      onChange={(e) => updateBlank(activeIndex!, segment.index, e.target.value)}
                    />
                  ),
                )}
              </p>
            ))}
      </div>

      {activeIndex !== null && (
        <div className={styles.exerciseActions}>
          <button type="button" className={styles.exerciseCheck} onClick={() => checkItem(activeIndex)}>
            Проверить
          </button>
          <button
            type="button"
            className={styles.exerciseShowExample}
            onClick={() => setActiveIndex(null)}
          >
            Показать пример
          </button>
          {isChecked && (
            <span
              className={activeCorrect ? styles.exerciseResultCorrect : styles.exerciseResultIncorrect}
            >
              {activeCorrect ? (
                "✓ Верно!"
              ) : (
                <>✕ Неверно. Правильный ответ: {activeTargets.join(", ")}</>
              )}
            </span>
          )}
        </div>
      )}

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
