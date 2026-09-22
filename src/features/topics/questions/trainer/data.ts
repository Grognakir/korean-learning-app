// Данные тренажёра «Вопросы» — рукописный набор (как контент остальных
// тренажёров-констант в приложении), не через БД/import-пайплайн.

import type { McqItem } from "./McqRunner";

export type QuestionWord = {
  kr: string;
  full: string;
  rr: string;
  ru: string;
  answers: string[];
};

// 14 의문사 и употребительных форм, индекс 0..13 — на индексы ссылаются
// MATCH_ROUNDS/DISTRACTORS ниже.
export const WORDS: QuestionWord[] = [
  { kr: "뭐", full: "뭐 / 무엇", rr: "mwo", ru: "что", answers: ["뭐", "무엇"] },
  { kr: "누구", full: "누구", rr: "nugu", ru: "кто", answers: ["누구"] },
  { kr: "어디", full: "어디", rr: "eodi", ru: "где / куда", answers: ["어디"] },
  { kr: "언제", full: "언제", rr: "eonje", ru: "когда", answers: ["언제"] },
  { kr: "왜", full: "왜", rr: "wae", ru: "почему", answers: ["왜"] },
  { kr: "어떻게", full: "어떻게", rr: "eotteoke", ru: "как (каким образом)", answers: ["어떻게"] },
  { kr: "얼마", full: "얼마", rr: "eolma", ru: "сколько (величина / цена)", answers: ["얼마"] },
  { kr: "얼마나", full: "얼마나", rr: "eolmana", ru: "насколько / как долго", answers: ["얼마나"] },
  { kr: "몇", full: "몇", rr: "myeot", ru: "сколько / какой по номеру", answers: ["몇"] },
  { kr: "어느", full: "어느", rr: "eoneu", ru: "который (из вариантов)", answers: ["어느"] },
  { kr: "무슨", full: "무슨", rr: "museun", ru: "что за (по типу)", answers: ["무슨"] },
  { kr: "며칠", full: "며칠", rr: "myeochil", ru: "какое число / сколько дней", answers: ["며칠"] },
  {
    kr: "어때요",
    full: "어떻다 → 어때요",
    rr: "eotteota → eottaeyo",
    ru: "каков / как тебе",
    answers: ["어때요", "어떻다"],
  },
  {
    kr: "어떤",
    full: "어떻다 → 어떤",
    rr: "eotteota → eotteon",
    ru: "какой (по качествам)",
    answers: ["어떤"],
  },
];

// Уровень «Сопоставление» — 7 раундов по 4 слова, каждое встречается ровно дважды.
export const MATCH_ROUNDS: number[][] = [
  [0, 1, 2, 3],
  [4, 5, 12, 13],
  [6, 7, 8, 11],
  [9, 10, 13, 0],
  [1, 5, 8, 12],
  [2, 3, 6, 11],
  [4, 7, 9, 10],
];

// Уровни «Узнавание» (kr→ru / ru→kr) — 2 набора дистракторов на каждое слово.
export const DISTRACTORS: number[][][] = [
  [[1, 2, 3], [9, 10, 6]],
  [[0, 2, 3], [9, 10, 8]],
  [[0, 1, 3], [4, 5, 7]],
  [[0, 1, 2], [7, 8, 11]],
  [[5, 12, 2], [3, 7, 9]],
  [[4, 12, 13], [0, 10, 9]],
  [[7, 8, 0], [9, 10, 3]],
  [[6, 8, 5], [2, 3, 4]],
  [[6, 7, 9], [1, 10, 11]],
  [[10, 13, 8], [0, 1, 2]],
  [[9, 13, 8], [0, 4, 5]],
  [[3, 8, 7], [2, 6, 9]],
  [[5, 13, 4], [3, 7, 9]],
  [[9, 10, 5], [0, 8, 12]],
];

export type QuestionPhrase = {
  kr: string;
  rr: string;
  ru: string;
  distractors: number[];
};

// Уровень «Живые вопросы» — пул из 18, за сессию берётся 12 случайных.
export const PHRASES: QuestionPhrase[] = [
  { kr: "몇 살이에요?", rr: "Myeot sarieyo?", ru: "Сколько лет?", distractors: [3, 9, 10] },
  { kr: "어디 가요?", rr: "Eodi gayo?", ru: "Куда идёшь?", distractors: [2, 8, 14] },
  { kr: "어디에서 왔어요?", rr: "Eodieseo wasseoyo?", ru: "Откуда приехал(а)?", distractors: [1, 8, 12] },
  { kr: "가족이 몇 명이에요?", rr: "Gajogi myeot myeongieyo?", ru: "Сколько человек в семье?", distractors: [0, 5, 10] },
  { kr: "이거 얼마예요?", rr: "Igeo eolmayeyo?", ru: "Сколько это стоит?", distractors: [5, 10, 9] },
  { kr: "몇 개 필요해요?", rr: "Myeot gae piryohaeyo?", ru: "Сколько штук нужно?", distractors: [4, 3, 10] },
  { kr: "이름이 뭐예요?", rr: "Ireumi mwoyeyo?", ru: "Как тебя зовут?", distractors: [11, 15, 12] },
  { kr: "생일이 언제예요?", rr: "Saengiri eonjeyeyo?", ru: "Когда день рождения?", distractors: [15, 9, 0] },
  { kr: "화장실이 어디예요?", rr: "Hwajangsiri eodiyeyo?", ru: "Где туалет?", distractors: [1, 2, 14] },
  { kr: "지금 몇 시예요?", rr: "Jigeum myeot siyeyo?", ru: "Который час?", distractors: [7, 15, 0] },
  { kr: "전화번호가 몇 번이에요?", rr: "Jeonhwabeonhoga myeot beonieyo?", ru: "Какой номер телефона?", distractors: [9, 3, 5] },
  { kr: "오늘 무슨 요일이에요?", rr: "Oneul museun yoirieyo?", ru: "Какой сегодня день недели?", distractors: [15, 7, 12] },
  { kr: "어느 나라 사람이에요?", rr: "Eoneu nara saramieyo?", ru: "Из какой страны?", distractors: [2, 11, 6] },
  { kr: "왜 한국어를 배워요?", rr: "Wae hangugeoreul baewoyo?", ru: "Почему учишь корейский?", distractors: [14, 6, 11] },
  { kr: "학교에 어떻게 가요?", rr: "Hakgyoe eotteoke gayo?", ru: "Как добираешься до школы?", distractors: [1, 2, 13] },
  { kr: "오늘이 며칠이에요?", rr: "Oneuri myeochirieyo?", ru: "Какое сегодня число?", distractors: [7, 9, 11] },
  { kr: "이 영화 어때요?", rr: "I yeonghwa eottaeyo?", ru: "Как тебе этот фильм?", distractors: [13, 14, 12] },
  { kr: "어떤 음악을 좋아해요?", rr: "Eotteon eumageul joahaeyo?", ru: "Какую музыку ты любишь?", distractors: [11, 12, 14] },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildWordMcqSession(direction: "kr2ru" | "ru2kr"): McqItem[] {
  const order = shuffle(WORDS.map((_, i) => i));
  return order.map((wi) => {
    const variant = pick(DISTRACTORS[wi]);
    const optIdxs = shuffle([wi, ...variant]);
    const opts = optIdxs.map((i) => (direction === "kr2ru" ? WORDS[i].ru : WORDS[i].kr));
    const w = WORDS[wi];
    return {
      promptKr: direction === "kr2ru" ? w.kr : null,
      promptRu: direction === "ru2kr" ? w.ru : null,
      opts,
      correctIndex: optIdxs.indexOf(wi),
      optsAreKr: direction === "ru2kr",
      explanationKr: w.full,
      explanationRr: w.rr,
      explanationRu: w.ru,
    };
  });
}

export function buildPhraseMcqSession(): McqItem[] {
  const pool = shuffle(PHRASES.map((_, i) => i)).slice(0, 12);
  return pool.map((pi) => {
    const direction: "kr2ru" | "ru2kr" = Math.random() < 0.5 ? "kr2ru" : "ru2kr";
    const p = PHRASES[pi];
    const optIdxs = shuffle([pi, ...p.distractors]);
    const opts = optIdxs.map((i) => (direction === "kr2ru" ? PHRASES[i].ru : PHRASES[i].kr));
    return {
      promptKr: direction === "kr2ru" ? p.kr : null,
      promptRu: direction === "ru2kr" ? p.ru : null,
      opts,
      correctIndex: optIdxs.indexOf(pi),
      optsAreKr: direction === "ru2kr",
      explanationKr: p.kr,
      explanationRr: p.rr,
      explanationRu: p.ru,
    };
  });
}
