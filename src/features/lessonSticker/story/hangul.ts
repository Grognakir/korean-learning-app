/** Набор по-корейски на своей экранной клавиатуре (두벌식): буквы собираются
 * в слоги в конце строки, ⌫ разбирает слог по одной букве. */

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
// Первый элемент — «без 받침».
const JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";

const BASE = 0xac00;

/** Сложные гласные: две простые → одна. */
const VOWEL_PAIRS: Record<string, string> = {
  ㅗㅏ: "ㅘ",
  ㅗㅐ: "ㅙ",
  ㅗㅣ: "ㅚ",
  ㅜㅓ: "ㅝ",
  ㅜㅔ: "ㅞ",
  ㅜㅣ: "ㅟ",
  ㅡㅣ: "ㅢ",
};

/** Двойные 받침: две согласные → одна. */
const FINAL_PAIRS: Record<string, string> = {
  ㄱㅅ: "ㄳ",
  ㄴㅈ: "ㄵ",
  ㄴㅎ: "ㄶ",
  ㄹㄱ: "ㄺ",
  ㄹㅁ: "ㄻ",
  ㄹㅂ: "ㄼ",
  ㄹㅅ: "ㄽ",
  ㄹㅌ: "ㄾ",
  ㄹㅍ: "ㄿ",
  ㄹㅎ: "ㅀ",
  ㅂㅅ: "ㅄ",
};

const split = (pairs: Record<string, string>) =>
  Object.fromEntries(Object.entries(pairs).map(([a, b]) => [b, [...a]]));
const VOWEL_PARTS = split(VOWEL_PAIRS);
const FINAL_PARTS = split(FINAL_PAIRS);

export const isVowel = (j: string) => JUNG.includes(j);

type Syllable = { cho: number; jung: number; jong: number };

function decompose(ch: string | undefined): Syllable | null {
  if (!ch) return null;
  const code = ch.charCodeAt(0) - BASE;
  if (code < 0 || code > 11171) return null;
  return {
    cho: Math.floor(code / 588),
    jung: Math.floor((code % 588) / 28),
    jong: code % 28,
  };
}

const compose = ({ cho, jung, jong }: Syllable) =>
  String.fromCharCode(BASE + (cho * 21 + jung) * 28 + jong);

/** Дописать букву (согласную или гласную) в конец строки. */
export function typeJamo(text: string, jamo: string): string {
  const head = text.slice(0, -1);
  const last = text.slice(-1);
  const syl = decompose(last);

  if (isVowel(jamo)) {
    const v = JUNG.indexOf(jamo);
    // Одиночная согласная + гласная → слог.
    if (CHO.includes(last) && last)
      return head + compose({ cho: CHO.indexOf(last), jung: v, jong: 0 });
    if (syl) {
      // 받침 уходит в новый слог (у двойного — вторая часть).
      if (syl.jong) {
        const fin = JONG[syl.jong];
        const parts = FINAL_PARTS[fin];
        const stay = parts ? JONG.indexOf(parts[0]) : 0;
        const move = parts ? parts[1] : fin;
        return (
          head +
          compose({ ...syl, jong: stay }) +
          compose({ cho: CHO.indexOf(move), jung: v, jong: 0 })
        );
      }
      // Гласная + гласная → сложная, если есть.
      const pair = VOWEL_PAIRS[JUNG[syl.jung] + jamo];
      if (pair) return head + compose({ ...syl, jung: JUNG.indexOf(pair) });
    }
    return text + jamo;
  }

  // Согласная.
  if (syl) {
    if (!syl.jong) {
      const j = JONG.indexOf(jamo);
      if (j > 0) return head + compose({ ...syl, jong: j });
    } else {
      const pair = FINAL_PAIRS[JONG[syl.jong] + jamo];
      if (pair) return head + compose({ ...syl, jong: JONG.indexOf(pair) });
    }
  }
  return text + jamo;
}

/** Стереть последнюю букву: слог разбирается по одной букве. */
export function backspace(text: string): string {
  const head = text.slice(0, -1);
  const syl = decompose(text.slice(-1));
  if (!syl) return head;
  if (syl.jong) {
    const parts = FINAL_PARTS[JONG[syl.jong]];
    return head + compose({ ...syl, jong: parts ? JONG.indexOf(parts[0]) : 0 });
  }
  const parts = VOWEL_PARTS[JUNG[syl.jung]];
  if (parts) return head + compose({ ...syl, jung: JUNG.indexOf(parts[0]) });
  return head + CHO[syl.cho];
}

/** Набрать последовательность букв (для тестов и подсказок). */
export const typeAll = (text: string, jamos: string) =>
  [...jamos].reduce((t, j) => (j === " " ? `${t} ` : typeJamo(t, j)), text);

/** 두벌식: три ряда; с ⇧ — двойные согласные и ㅒ ㅖ. */
export const LAYOUT = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

export const SHIFTED: Record<string, string> = {
  ㅂ: "ㅃ",
  ㅈ: "ㅉ",
  ㄷ: "ㄸ",
  ㄱ: "ㄲ",
  ㅅ: "ㅆ",
  ㅐ: "ㅒ",
  ㅔ: "ㅖ",
};
