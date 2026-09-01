"use client";

import { useState } from "react";
import type { GrammarExerciseBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

type Segment = { kind: "text"; text: string } | { kind: "blank"; index: number };
type Status = "neutral" | "correct" | "incorrect";

function ChevronLeft() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path
        d="M5.5 1L2 4L5.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Один элемент given иногда сам содержит " / " и означает два отдельных
// слова-пропуска, не стоящих в тексте рядом (см. exercise-1b/exercise-3a
// в lesson-01.json) — разбиваем на плоский список, для "чистых" элементов
// (без " / ") это no-op.
function splitGiven(given: string[]): string[] {
  return given.flatMap((g) => g.split(" / "));
}

// Пропуски ищутся последовательно, а не глобальным поиском по всему
// тексту разом — иначе повторяющееся слово (например "중국" дважды в
// exercise-3a) находило бы одно и то же первое вхождение для обоих
// пропусков.
function layoutBlanks(dialogue: string[], blanks: string[]): Segment[][] {
  let cursor = 0;
  return dialogue.map((line) => {
    const segments: Segment[] = [];
    let pos = 0;
    while (cursor < blanks.length) {
      const idx = line.indexOf(blanks[cursor], pos);
      if (idx === -1) break;
      if (idx > pos) segments.push({ kind: "text", text: line.slice(pos, idx) });
      segments.push({ kind: "blank", index: cursor });
      pos = idx + blanks[cursor].length;
      cursor++;
    }
    segments.push({ kind: "text", text: line.slice(pos) });
    return segments;
  });
}

function statusClass(status: Status) {
  if (status === "correct") return styles.exerciseItemCorrect;
  if (status === "incorrect") return styles.exerciseItemIncorrect;
  return styles.exerciseItem;
}

function blankClass(status: Status) {
  if (status === "correct") return styles.blankCorrect;
  if (status === "incorrect") return styles.blankIncorrect;
  return styles.blank;
}

export function GrammarExercise({
  block,
  id,
}: {
  block: GrammarExerciseBlock;
  id?: string;
}) {
  const blanks = splitGiven(block.example.given);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [inputs, setInputs] = useState<Record<number, string[]>>({});

  function targetsFor(itemIndex: number): string[] {
    return splitGiven(block.items[itemIndex].given);
  }

  function statusFor(itemIndex: number): Status {
    const values = inputs[itemIndex];
    if (!values || values.some((v) => !v.trim())) return "neutral";
    const targets = targetsFor(itemIndex);
    const ok = values.every((v, i) => v.trim() === targets[i]?.trim());
    return ok ? "correct" : "incorrect";
  }

  function selectItem(itemIndex: number) {
    setActiveIndex(itemIndex);
    setInputs((prev) =>
      prev[itemIndex] ? prev : { ...prev, [itemIndex]: Array(blanks.length).fill("") },
    );
  }

  function updateBlank(itemIndex: number, blankIndex: number, value: string) {
    setInputs((prev) => {
      const current = prev[itemIndex] ?? Array(blanks.length).fill("");
      const next = [...current];
      next[blankIndex] = value;
      return { ...prev, [itemIndex]: next };
    });
  }

  const activeValues = activeIndex !== null ? (inputs[activeIndex] ?? []) : [];
  const activeStatus = activeIndex !== null ? statusFor(activeIndex) : "neutral";
  // Ширина поля — по длине слова, которое реально нужно вписать для
  // выбранного чипа (у разных вариантов слова разной длины), а не по
  // длине исходного слова, которое было в примере.
  const activeTargets = activeIndex !== null ? targetsFor(activeIndex) : [];
  const lines =
    activeIndex !== null ? layoutBlanks(block.example.dialogue, blanks) : null;

  return (
    <div id={id} className={styles.block}>
      <span className={`${styles.label} kr`}>{block.exercise_title}</span>
      <span className={`${styles.prompt} kr`}>{block.prompt}</span>
      <div className={styles.exerciseDialogue}>
        {block.example.dialogue.map((line, i) =>
          lines ? (
            <p key={i} className="kr">
              {lines[i].map((segment, j) =>
                segment.kind === "text" ? (
                  <span key={j}>{segment.text}</span>
                ) : (
                  <input
                    key={j}
                    className={`${blankClass(activeStatus)} kr`}
                    style={{
                      width: `${Math.max(
                        activeTargets[segment.index]?.length ?? blanks[segment.index].length,
                        1,
                      ) + 1}ch`,
                    }}
                    value={activeValues[segment.index] ?? ""}
                    onChange={(e) =>
                      updateBlank(activeIndex!, segment.index, e.target.value)
                    }
                  />
                ),
              )}
            </p>
          ) : (
            <p key={i} className="kr">
              {line}
            </p>
          ),
        )}
      </div>
      <div className={styles.exerciseItems}>
        {activeIndex !== null && (
          <button
            type="button"
            className={styles.exerciseBackArrow}
            onClick={() => setActiveIndex(null)}
            aria-label="Показать пример без пропусков"
          >
            <ChevronLeft />
          </button>
        )}
        {block.items.map((item, i) => (
          <button
            key={i}
            type="button"
            className={`${statusClass(statusFor(i))} ${i === activeIndex ? styles.exerciseItemActive : ""} kr`}
            onClick={() => selectItem(i)}
          >
            {item.given.join(" / ")}
          </button>
        ))}
      </div>
    </div>
  );
}
