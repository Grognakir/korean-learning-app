// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { areaKey, areaLabel, countRange, effectiveCount, grammarSearch, parseGrammarParams } from "@/features/trainers/grammar/areas";
import { checkAnswer } from "@/features/trainers/grammar/checkAnswer";
import { buildGrammarSession } from "@/features/trainers/grammar/session";
import type { GrammarExercises, PracticeTask, TrainerGrammar } from "@/features/trainers/grammar/types";

type Point = { external_id: string; pattern: string; short_desc: string | null; category: string; explanation: string | null; rules: string[]; usage: string[]; examples: { kr: string; ru: string }[] };

const read = <T>(path: string): T => JSON.parse(readFileSync(join(process.cwd(), path), "utf-8"));
const points = read<{ points: Point[] }>("content/dictionary/grammar.json").points;
const exercises = read<{ exercises: (GrammarExercises & { grammar_external_id: string })[] }>("content/trainers/grammar-exercises.json").exercises;

const pool: TrainerGrammar[] = exercises.map((e) => {
  const p = points.find((point) => point.external_id === e.grammar_external_id)!;
  return {
    id: p.external_id, pattern: p.pattern, meaning: p.short_desc, category: p.category, explanation: p.explanation,
    rules: p.rules, usage: p.usage, examples: p.examples,
    drills: e.drills, match: e.match, cloze: e.cloze, reply: e.reply, blitz: e.blitz,
  };
});

const key = (value: unknown) => JSON.stringify(value);
const RUNS = 150;

// Все формы, которые в данных означают текст вопроса, — кроме правильного
// ответа ни одна из них не должна оказаться среди вариантов блица.
const meanings = new Map<string, Set<string>>();
for (const g of pool) {
  for (const pair of [...g.blitz, ...g.match]) {
    meanings.set(`ru:${pair.ru}`, (meanings.get(`ru:${pair.ru}`) ?? new Set()).add(pair.kr));
    meanings.set(`kr:${pair.kr}`, (meanings.get(`kr:${pair.kr}`) ?? new Set()).add(pair.ru));
  }
}

function expectSolvableBlitz(session: ReturnType<typeof buildGrammarSession>) {
  for (const question of session.blitz) {
    expect(new Set(question.options).size).toBe(question.options.length);
    expect(question.options).toContain(question.answer);
    const alsoRight = meanings.get(`${question.dir}:${question.prompt}`) ?? new Set();
    expect(question.options.filter((o) => o !== question.answer && alsoRight.has(o))).toEqual([]);
  }
}

describe("количество грамматик", () => {
  it.each([
    [0, 5, false, 0],
    [3, 10, false, 3],
    [5, 10, false, 5],
    [7, 1, true, 5],
    [7, 20, true, 7],
    [12, 8, true, 8],
    [25, 30, true, 20],
  ])("доступно %i, запрошено %i", (available, requested, adjustable, expected) => {
    expect(countRange(available).adjustable).toBe(adjustable);
    expect(effectiveCount(available, requested)).toBe(expected);
  });

  it("ограничивает ползунок двадцатью", () => {
    expect(countRange(84)).toEqual({ min: 5, max: 20, adjustable: true });
  });
});

it("разбирает области и параметры сессии", () => {
  expect(areaKey("6. Модальность — возможность, необходимость, желание, разрешение")).toBe("6");
  expect(areaLabel("6. Модальность — возможность, необходимость, желание, разрешение")).toBe("Модальность");
  expect(areaLabel("3. Время и вид глагола")).toBe("Время и вид глагола");
  expect(parseGrammarParams({ areas: "3,4,3", count: "8", blitz: "9" })).toEqual({ areas: ["3", "4"], count: 8, blitz: 5 });
  expect(parseGrammarParams({})).toEqual({ areas: null, count: 5, blitz: 3 });
  expect(grammarSearch({ areas: ["3", "4"], count: 8, blitz: 2 })).toBe("areas=3,4&count=8&blitz=2");
});

it("принимает ответ без учёта пробелов, финальной точки и нормализации Unicode", () => {
  const answers = ["저는 학교에 가요.", "저는 학교에 갑니다."];
  expect(checkAnswer(answers, "저는 학교에 갑니다")).toBe(true);
  expect(checkAnswer(answers, "  저는   학교에 가요 . ")).toBe(true);
  expect(checkAnswer(answers, "저는 학교에 가요.".normalize("NFD"))).toBe(true);
  expect(checkAnswer(answers, "저는 학교에 갔어요.")).toBe(false);
  expect(checkAnswer(answers, "   ")).toBe(false);
});

describe.each([5, 10, 12])("сессия на %i грамматик", (count) => {
  it("собирает все этапы без повторов и неоднозначностей", () => {
    for (let run = 0; run < RUNS; run++) {
      const session = buildGrammarSession(pool, count);
      expect(session.study).toHaveLength(count);

      const byType = (type: PracticeTask["type"]) => session.tasks.filter((t) => t.type === type);
      const rounds = byType("match") as Extract<PracticeTask, { type: "match" }>[];
      expect(rounds).toHaveLength(Math.ceil(count / 5) * 2);
      for (const round of rounds) {
        expect(round.pairs).toHaveLength(5);
        expect(new Set(round.pairs.map((p) => p.ru)).size).toBe(5);
        expect(new Set(round.pairs.map((p) => p.kr)).size).toBe(5);
        expect([...round.ru].sort()).toEqual(round.pairs.map((p) => p.ru).sort());
      }

      for (const item of session.study) {
        expect(item.quiz).toHaveLength(3);
        const practice = session.tasks.filter((t) => t.type === "drill" && t.pattern === item.pattern);
        expect(practice).toHaveLength(3);
        const quizKeys = new Set(item.quiz.map(key));
        for (const task of practice) expect(quizKeys.has(key(task.type === "drill" && task.item))).toBe(false);

        const source = pool.find((g) => g.pattern === item.pattern)!;
        for (const type of ["cloze", "reply"] as const) {
          const tasks = byType(type).filter((t) => "pattern" in t && t.pattern === item.pattern);
          expect(tasks).toHaveLength(2);
          for (const task of tasks) {
            if (task.type !== "cloze" && task.type !== "reply") continue;
            const original = (source[type] as { options: string[]; correct: number }[])
              .find((o) => [...o.options].sort().join() === [...task.item.options].sort().join())!;
            expect(task.item.options[task.item.correct]).toBe(original.options[original.correct]);
          }
        }

        const blitz = session.blitz.filter((q) => q.pattern === item.pattern);
        expect(blitz.filter((q) => q.dir === "kr")).toHaveLength(2);
        expect(blitz.filter((q) => q.dir === "ru")).toHaveLength(2);
      }

      for (const question of session.blitz) expect(question.options).toHaveLength(4);
      expectSolvableBlitz(session);
    }
  });
});

it("не подставляет синонимы в блиц сессии из одной грамматики", () => {
  for (const id of ["grammar-안 V / V-지 않다", "grammar-못 V / V-지 못하다"]) {
    const single = pool.filter((g) => g.id === id);
    for (let run = 0; run < RUNS; run++) expectSolvableBlitz(buildGrammarSession(single, 5));
  }
});

it("добирает раунды соответствий, когда грамматик меньше пяти", () => {
  const small = pool.filter((g) => g.category.startsWith("6."));
  for (let run = 0; run < RUNS; run++) {
    const session = buildGrammarSession(small, 5);
    expect(session.study).toHaveLength(small.length);
    const rounds = session.tasks.filter((t) => t.type === "match");
    expect(rounds).toHaveLength(2);
    for (const round of rounds) {
      if (round.type !== "match") continue;
      expect(round.pairs).toHaveLength(5);
      expect(new Set(round.pairs.map((p) => p.ru)).size).toBe(5);
    }
    expectSolvableBlitz(session);
  }
});
