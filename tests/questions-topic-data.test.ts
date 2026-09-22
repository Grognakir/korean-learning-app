import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionsTopic } from "@/features/topics/questions/QuestionsTopic";
import { WORD_CARDS } from "@/features/topics/questions/wordCards";
import {
  DISTRACTORS,
  MATCH_ROUNDS,
  PHRASES,
  WORDS,
  buildPhraseMcqSession,
  buildWordMcqSession,
} from "@/features/topics/questions/trainer/data";

describe("тема вопросительных слов", () => {
  it("показывает боковое и мобильное содержание с одинаковыми разделами", () => {
    render(QuestionsTopic());

    expect(screen.getAllByRole("navigation", { name: "Содержание темы" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "01 Типы вопросов" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "09 Шпаргалка" })).toHaveLength(2);
    expect(screen.getByText("Содержание темы")).not.toBeNull();
  });

  it("содержит полный основной набор в карточках и тренажёре", () => {
    expect(WORD_CARDS).toHaveLength(14);
    expect(WORDS).toHaveLength(14);
    expect(WORD_CARDS.some((word) => word.kr === "어떤")).toBe(true);
    expect(WORD_CARDS.some((word) => word.kr.includes("어때요"))).toBe(true);
    expect(WORDS.some((word) => word.kr === "어떤")).toBe(true);
    expect(WORDS.some((word) => word.kr === "어때요")).toBe(true);
  });

  it("использует валидные индексы и показывает каждое слово дважды в сопоставлении", () => {
    const occurrences = Array.from({ length: WORDS.length }, () => 0);

    for (const round of MATCH_ROUNDS) {
      expect(round).toHaveLength(4);
      expect(new Set(round).size).toBe(round.length);
      for (const wordIndex of round) {
        expect(WORDS[wordIndex]).toBeDefined();
        occurrences[wordIndex] += 1;
      }
    }

    expect(occurrences).toEqual(Array.from({ length: WORDS.length }, () => 2));
  });

  it("держит дистракторы слов и фраз в допустимых границах", () => {
    expect(DISTRACTORS).toHaveLength(WORDS.length);

    DISTRACTORS.forEach((variants, wordIndex) => {
      expect(variants).toHaveLength(2);
      variants.forEach((variant) => {
        expect(variant).toHaveLength(3);
        expect(new Set(variant).size).toBe(variant.length);
        expect(variant).not.toContain(wordIndex);
        variant.forEach((distractorIndex) => expect(WORDS[distractorIndex]).toBeDefined());
      });
    });

    PHRASES.forEach((phrase, phraseIndex) => {
      expect(phrase.distractors).toHaveLength(3);
      expect(new Set(phrase.distractors).size).toBe(phrase.distractors.length);
      expect(phrase.distractors).not.toContain(phraseIndex);
      phrase.distractors.forEach((distractorIndex) => expect(PHRASES[distractorIndex]).toBeDefined());
    });
  });

  it("создаёт полные сессии с четырьмя вариантами ответа", () => {
    for (const direction of ["kr2ru", "ru2kr"] as const) {
      const session = buildWordMcqSession(direction);
      expect(session).toHaveLength(WORDS.length);
      session.forEach((item) => {
        expect(item.opts).toHaveLength(4);
        expect(item.correctIndex).toBeGreaterThanOrEqual(0);
        expect(item.correctIndex).toBeLessThan(item.opts.length);
      });
    }

    const phraseSession = buildPhraseMcqSession();
    expect(phraseSession).toHaveLength(12);
    phraseSession.forEach((item) => expect(item.opts).toHaveLength(4));
  });
});
