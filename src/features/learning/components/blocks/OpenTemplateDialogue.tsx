"use client";

import { useState } from "react";
import type { TextLine } from "@/features/learning/types";
import { speakerClassName } from "./speakerClassName";
import { inputWidthEm } from "./GrammarExercise";
import styles from "./blocks.module.css";

type Segment = { kind: "text"; text: string } | { kind: "blank"; index: number };

// Каждая строка шаблона делит "___" на пропуски по позиции внутри строки:
// позиция 0 — страна ("...에서 온"), позиция 1 — имя (после него в тексте
// сразу идёт " 합니다" — грамматику "(이)라고" студент дописывает САМ,
// внутри этого же пропуска, выбирая между 라고/이라고 по받침 введённого
// имени). Это не разбор общего {0}/{1}-шаблона (см.
// GrammarExercise.parseTemplate), а версия попроще — ровно под "___", раз
// тут нет ни cues, ни answers для сверки.
function parseBlanks(text: string): Segment[] {
  const parts = text.split("___");
  const segments: Segment[] = [];
  parts.forEach((part, i) => {
    if (part) segments.push({ kind: "text", text: part });
    if (i < parts.length - 1) segments.push({ kind: "blank", index: i });
  });
  return segments;
}

// Разбирает "민수라고"/"민수이라고" на голое имя и найденный суффикс —
// "이라고" длиннее "라고", поэтому проверяем именно её первой. Суффикс
// null, пока студент не дописал ни один из двух вариантов целиком.
function parseQuoteGrammar(value: string): { base: string; suffix: "라고" | "이라고" | null } {
  if (value.endsWith("이라고")) return { base: value.slice(0, -3), suffix: "이라고" };
  if (value.endsWith("라고")) return { base: value.slice(0, -2), suffix: "라고" };
  return { base: value, suffix: null };
}

// Слоговый блок Хангыля — ОДИН precomposed кодпоинт (U+AC00–U+D7A3);
// раскладка на чо/чунг/жонг формулой Unicode, жонгсонг = 0 — без받침.
// Это не то же самое, что "проблема 자를" (разбиение готового ТЕКСТА на
// подстроки-совпадения): там граница резала синтагму насильно и
// физически было невозможно склеить обратно то, что уже разъединили. Тут
// же имя вводится студентом цельным словом — разбиения нет, декодируем
// последний слог напрямую. Не-хангыль (например латиница) — null, судить
// не о чем.
function hasBatchim(char: string): boolean | null {
  const code = char.codePointAt(0);
  if (code === undefined || code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28 !== 0;
}

// "neutral" — рано судить (имя или суффикс ещё не дописаны, либо
// последний символ имени не хангыль); иначе — сравнение выбранного
// суффикса с тем, что диктует받침 введённого имени.
function quoteGrammarStatus(value: string): "neutral" | "correct" | "incorrect" {
  const { base, suffix } = parseQuoteGrammar(value);
  const lastChar = Array.from(base).pop();
  if (!lastChar || !suffix) return "neutral";
  const batchim = hasBatchim(lastChar);
  if (batchim === null) return "neutral";
  const expected = batchim ? "이라고" : "라고";
  return suffix === expected ? "correct" : "incorrect";
}

const PLACEHOLDER = ["나라", "이름"];

/**
 * Открытая практика без книжного "правильного ответа" — студент сам
 * придумывает N вариантов (имя+страна) и по очереди вписывает их в один
 * и тот же диалог-шаблон. Выбранный чип делает "___" редактируемыми;
 * значение по позиции 0/1 внутри строки одинаково для ВСЕХ строк
 * шаблона (одно и то же имя/страна во всех предложениях варианта).
 * Ярлык чипа отражает то, что студент ввёл, пока не ввёл — плейсхолдер
 * "나라 / 이름".
 */
export function OpenTemplateDialogue({
  lines,
  count,
}: {
  lines: TextLine[];
  count: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [values, setValues] = useState<Record<number, string[]>>({});

  function update(blankIndex: number, value: string) {
    if (activeIndex === null) return;
    setValues((prev) => {
      const current = prev[activeIndex] ?? ["", ""];
      const next = [...current];
      next[blankIndex] = value;
      return { ...prev, [activeIndex]: next };
    });
  }

  const activeValues = activeIndex !== null ? (values[activeIndex] ?? ["", ""]) : ["", ""];

  return (
    <>
      <div className={styles.exerciseDialogue}>
        {lines.map((line, i) => {
          const segments = parseBlanks(line.text);
          return (
            <p key={i} className="kr">
              {line.speaker && (
                <span className={`${speakerClassName(line.speaker)} kr`}>{line.speaker}:</span>
              )}{" "}
              {segments.map((segment, j) =>
                segment.kind === "text" ? (
                  <span key={j}>{segment.text}</span>
                ) : activeIndex === null ? (
                  <span key={j} className={styles.prompt}>
                    ___
                  </span>
                ) : (
                  (() => {
                    const value = activeValues[segment.index] ?? "";
                    // Суффикс "(이)라고" дописывает сам студент только в
                    // именном пропуске (позиция 1) — у страны (позиция 0)
                    // судить не о чем, там всегда нейтральный .blank.
                    const status = segment.index === 1 ? quoteGrammarStatus(value) : "neutral";
                    const blankClass =
                      status === "correct"
                        ? styles.blankCorrect
                        : status === "incorrect"
                          ? styles.blankIncorrect
                          : styles.blank;
                    return (
                      <input
                        key={j}
                        className={`${blankClass} kr`}
                        style={{ width: `calc(${inputWidthEm(value)}em + 14px)` }}
                        value={value}
                        onChange={(e) => update(segment.index, e.target.value)}
                      />
                    );
                  })()
                ),
              )}
            </p>
          );
        })}
      </div>
      <div className={styles.exerciseItems}>
        {Array.from({ length: count }, (_, i) => {
          const filled = values[i];
          const name = filled?.[1] ? parseQuoteGrammar(filled[1]).base : "";
          const label = `${name || PLACEHOLDER[1]} / ${filled?.[0] || PLACEHOLDER[0]}`;
          return (
            <button
              key={i}
              type="button"
              className={`${styles.exerciseItem} ${i === activeIndex ? styles.exerciseItemActive : ""} kr`}
              onClick={() => setActiveIndex(i)}
            >
              <span className={styles.exerciseItemNumber} aria-hidden="true">
                {i + 1}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
