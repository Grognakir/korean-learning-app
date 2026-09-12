// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import type { GrammarExercises } from "@/features/trainers/grammar/types";

const read = <T>(path: string): T => JSON.parse(readFileSync(join(process.cwd(), path), "utf-8"));
const points = read<{ points: { external_id: string; category: string }[] }>("content/dictionary/grammar.json").points;
const exercises = read<{ exercises: (GrammarExercises & { grammar_external_id: string })[] }>("content/trainers/grammar-exercises.json").exercises;

it.each(exercises.map((e) => [e.grammar_external_id, e] as const))("%s: полный и корректный набор заданий", (id, e) => {
  expect(points.some((p) => p.external_id === id)).toBe(true);
  expect([e.drills.length, e.match.length, e.cloze.length, e.reply.length, e.blitz.length]).toEqual([10, 5, 5, 5, 10]);

  for (const drill of e.drills) {
    expect(drill.base_kr && drill.base_ru && drill.task_ru).toBeTruthy();
    expect(drill.answers.length).toBeGreaterThanOrEqual(2);
    expect(drill.answers.every(Boolean)).toBe(true);
  }
  for (const item of [...e.cloze, ...e.reply]) {
    expect(item.options).toHaveLength(5);
    expect(new Set(item.options).size).toBe(5);
    expect(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < 5).toBe(true);
  }
  for (const pair of [...e.match, ...e.blitz]) expect(pair.kr && pair.ru).toBeTruthy();
});

// Русский ярлык не должен встречаться у разных грамматик (например,
// 만들어요 и 만듭니다 — оба «делаю»): в соответствиях и блице такие пары
// неразличимы. Синонимы внутри одной грамматики (안 먹어요 / 먹지 않아요)
// допустимы — их разводит сборка сессии.
it("русские ярлыки соответствий и блица не пересекаются между грамматиками", () => {
  const grammarsByRu = new Map<string, Set<string>>();
  for (const e of exercises) {
    for (const pair of [...e.match, ...e.blitz]) {
      grammarsByRu.set(pair.ru, (grammarsByRu.get(pair.ru) ?? new Set()).add(e.grammar_external_id));
    }
  }
  const shared = [...grammarsByRu].filter(([, ids]) => ids.size > 1).map(([ru, ids]) => `${ru}: ${[...ids].join(", ")}`);
  expect(shared).toEqual([]);
});
