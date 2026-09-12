import { shuffle } from "@/features/trainers/flashcards/buildQueue";
import { BLITZ_PER_GRAMMAR, effectiveCount } from "./areas";
import type {
  BlitzQuestion,
  GrammarBlitzItem,
  GrammarMatchPair,
  GrammarSessionData,
  PracticeTask,
  StudyItem,
  TrainerGrammar,
} from "./types";

const EXAMPLES_SHOWN = 3;
const STUDY_DRILLS = 3;
const PRACTICE_DRILLS = 3;
const CHOICES_PER_GRAMMAR = 2;
const PAIRS_PER_ROUND = 5;
const BLITZ_WRONG_OPTIONS = 3;

const pick = <T>(items: T[], n: number) => shuffle(items).slice(0, n);

function shuffleChoice<T extends { options: string[]; correct: number }>(item: T): T {
  const order = shuffle(item.options.map((_, i) => i));
  return { ...item, options: order.map((i) => item.options[i]), correct: order.indexOf(item.correct) };
}

/* Соответствия: раунд — пять пар из разных грамматик. Внутри раунда не
   должно быть двух пар с одинаковым переводом или одинаковой формой:
   такую пару невозможно соединить однозначно. Сначала по одной паре
   с каждой грамматики; если грамматик меньше пяти, раунд добирается
   вторыми парами тех же. */
function buildMatchRounds(grammars: TrainerGrammar[]): PracticeTask[] {
  const rounds = Math.ceil(grammars.length / PAIRS_PER_ROUND) * 2;
  const target = Math.min(PAIRS_PER_ROUND, grammars.reduce((sum, g) => sum + g.match.length, 0));
  const unused = new Map(grammars.map((g) => [g.id, shuffle(g.match)]));
  const tasks: PracticeTask[] = [];

  for (let r = 0; r < rounds; r++) {
    const pairs: (GrammarMatchPair & { pattern: string })[] = [];
    const seenRu = new Set<string>();
    const seenKr = new Set<string>();
    const fits = (m: GrammarMatchPair) => !seenRu.has(m.ru) && !seenKr.has(m.kr);
    let progress = true;
    while (pairs.length < target && progress) {
      progress = false;
      for (const g of shuffle(grammars)) {
        if (pairs.length === target) break;
        const queue = unused.get(g.id)!;
        const chosen = queue.find(fits) ?? g.match.find(fits);
        if (!chosen) continue;
        const qi = queue.indexOf(chosen);
        if (qi !== -1) queue.splice(qi, 1);
        seenRu.add(chosen.ru);
        seenKr.add(chosen.kr);
        pairs.push({ ...chosen, pattern: g.pattern });
        progress = true;
      }
    }
    if (pairs.length > 1) {
      tasks.push({ type: "match", pairs: shuffle(pairs), ru: shuffle(pairs.map((p) => p.ru)) });
    }
  }
  return tasks;
}

/* Блиц: по два вопроса каждого направления на грамматику. Отвлекающие
   варианты — по кругу из других грамматик, чтобы не все были из одной;
   в маленькой сессии добираем другими формами той же. Совпавший
   с правильным ответом вариант сделал бы вопрос нерешаемым — как и
   синоним: у одной грамматики «не ем» — это и 안 먹어요, и 먹지 않아요,
   поэтому пары с тем же текстом вопроса в варианты не берём. */
function buildBlitz(grammars: TrainerGrammar[]): BlitzQuestion[] {
  const questions: BlitzQuestion[] = [];
  for (const g of grammars) {
    const others = grammars.filter((o) => o.id !== g.id);
    pick(g.blitz, BLITZ_PER_GRAMMAR).forEach((item, i) => {
      const dir = i < BLITZ_PER_GRAMMAR / 2 ? "kr" : "ru";
      const side = dir === "kr" ? "ru" : "kr";
      const prompt = item[dir];
      const answer = item[side];
      const lists = shuffle(others).map((o) => shuffle(o.blitz));
      const pool: GrammarBlitzItem[] = [];
      for (let k = 0; lists.some((l) => k < l.length); k++) {
        for (const l of lists) if (k < l.length) pool.push(l[k]);
      }
      pool.push(...shuffle(g.blitz.filter((b) => b !== item)));
      const wrong: string[] = [];
      for (const candidate of pool) {
        const option = candidate[side];
        if (candidate[dir] !== prompt && option !== answer && !wrong.includes(option)) wrong.push(option);
        if (wrong.length === BLITZ_WRONG_OPTIONS) break;
      }
      questions.push({ dir, pattern: g.pattern, prompt, answer, options: shuffle([answer, ...wrong]) });
    });
  }
  return shuffle(questions);
}

export function buildGrammarSession(pool: TrainerGrammar[], requestedCount: number): GrammarSessionData {
  const grammars = pick(pool, effectiveCount(pool.length, requestedCount));

  const study: StudyItem[] = [];
  const tasks: PracticeTask[] = [];
  for (const g of grammars) {
    // Часть преобразований уходит в мини-проверку сразу после правила,
    // остальные — в общий блок, чтобы задания не повторялись.
    const drills = shuffle(g.drills);
    study.push({
      id: g.id,
      pattern: g.pattern,
      meaning: g.meaning,
      category: g.category,
      explanation: g.explanation,
      rules: g.rules,
      usage: g.usage,
      examples: pick(g.examples, EXAMPLES_SHOWN),
      quiz: drills.slice(0, STUDY_DRILLS),
    });
    for (const item of drills.slice(STUDY_DRILLS, STUDY_DRILLS + PRACTICE_DRILLS)) {
      tasks.push({ type: "drill", pattern: g.pattern, item });
    }
    for (const item of pick(g.cloze, CHOICES_PER_GRAMMAR)) {
      tasks.push({ type: "cloze", pattern: g.pattern, item: shuffleChoice(item) });
    }
    for (const item of pick(g.reply, CHOICES_PER_GRAMMAR)) {
      tasks.push({ type: "reply", pattern: g.pattern, item: shuffleChoice(item) });
    }
  }
  tasks.push(...buildMatchRounds(grammars));

  return {
    id: crypto.randomUUID(),
    study,
    tasks: shuffle(tasks),
    blitz: buildBlitz(grammars),
  };
}
