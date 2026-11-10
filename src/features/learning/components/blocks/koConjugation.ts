/**
 * Стяжённые и неправильные формы глаголов и прилагательных на -다, которые
 * не находятся простым поиском основы (봤, 큰, 어려워, 들어, 그래, 사는…).
 * Чистая логика без React: по словарной форме строит список написаний.
 */

export type ConjugatedForm = {
  /** Что искать в тексте. */
  text: string;
  /** Сколько первых символов подсвечивать (ㅂ-форма 갑니다 → только 갑). */
  chip: number;
  /**
   * any — ничего не требуется после; break — дальше конец слова (간 곳, 갈 거예요,
   * но не 간식); ending — конец слова или окончание 요/서/도/야/라 (봐요, 봐서);
   * это отсекает 커피 для 크다 и 들어가요 для 듣다.
   */
  after: "any" | "break" | "ending";
  /** Короткая форма принимается только с начала слова (친구들은 ≠ 듣다). */
  wordStart: boolean;
};

const BASE = 0xac00;
const V = { a: 0, ae: 1, ya: 2, yae: 3, eo: 4, yeo: 6, o: 8, wa: 9, wae: 10, oe: 11, u: 13, wo: 14, eu: 18, i: 20 };
const T = { none: 0, n: 4, l: 8, b: 17, ss: 20, h: 27 };
const ONSET_R = 5;

function parts(ch: string | undefined): { l: number; v: number; t: number } | null {
  if (!ch) return null;
  const code = ch.charCodeAt(0) - BASE;
  if (code < 0 || code > 11171) return null;
  return { l: Math.floor(code / 588), v: Math.floor((code % 588) / 28), t: code % 28 };
}

function make(l: number, v: number, t: number): string {
  return String.fromCharCode(BASE + (l * 21 + v) * 28 + t);
}

const COMMON_OPEN_SYLLABLES = new Set(["주", "나", "자", "가", "타", "하", "서", "오", "보", "두"]);
const BIEUP_REGULAR = /(입|잡|좁|씹|뽑|접|업|집|꼽)$/;
const DIGEUT_IRREGULAR = /(듣|묻|걷|깨닫|싣|긷|일컫)$/;
const SIOT_IRREGULAR = /(낫|짓|붓|젓|긋|잇)$/;
const HIEUT_IRREGULAR = /(렇|랗|갛|얗|맣|떻)$/;

export function conjugatedForms(ko: string): ConjugatedForm[] {
  if (ko.length < 2 || !ko.endsWith("다")) return [];
  const stem = ko.slice(0, -1);
  if (stem.endsWith("하")) return [];
  const chars = Array.from(stem);
  const last = parts(chars[chars.length - 1]);
  if (!last) return [];
  const head = chars.slice(0, -1).join("");
  const prev = parts(chars[chars.length - 2]);
  const forms: ConjugatedForm[] = [];

  const add = (
    body: string,
    after: ConjugatedForm["after"] = "any",
    chip: number | null = null,
  ) => {
    const text = head + body;
    forms.push({ text, chip: chip ?? text.length, after, wordStart: text.length < 3 });
  };
  const addWhole = (text: string, after: ConjugatedForm["after"], chip: number) => {
    forms.push({ text, chip, after, wordStart: text.length < 3 });
  };
  // Окончания -ㄴ / -ㄹ / -ㅂ(니다) на открытом слоге основы.
  const closeSyllable = (v: number) => {
    add(make(last.l, v, T.n), "break");
    add(make(last.l, v, T.l), "break");
    addWhole(head + make(last.l, v, T.b) + "니", "any", head.length + 1);
  };

  const { l, v, t } = last;
  const bright = (vowel: number) => vowel === V.a || vowel === V.o;

  if (t === T.none) {
    if (v === V.eu && l === ONSET_R && prev && prev.t === T.none) {
      // 르-неправильные (모르다 → 몰라, 다르다 → 달라, 부르다 → 불러)
      const before = chars.slice(0, -2).join("");
      const lead = make(prev.l, prev.v, T.l);
      const vowel = bright(prev.v) ? V.a : V.eo;
      for (const [body, after] of [
        [make(ONSET_R, vowel, 0), "ending"],
        [make(ONSET_R, vowel, T.ss), "any"],
      ] as const) {
        const text = before + lead + body;
        forms.push({ text, chip: text.length, after, wordStart: text.length < 3 });
      }
      closeSyllable(V.eu);
      return forms;
    }
    if (v === V.eu) {
      // ㅡ-основы: 크다 → 커, 쓰다 → 써, 바쁘다 → 바빠
      const vowel = prev && bright(prev.v) ? V.a : V.eo;
      add(make(l, vowel, 0), "ending");
      add(make(l, vowel, T.ss));
      closeSyllable(V.eu);
      return forms;
    }
    if (v === V.o) {
      add(make(l, V.wa, 0), "ending");
      add(make(l, V.wa, T.ss));
    } else if (v === V.u) {
      add(make(l, V.wo, 0), "ending");
      add(make(l, V.wo, T.ss));
    } else if (v === V.i) {
      add(make(l, V.yeo, 0), "ending");
      add(make(l, V.yeo, T.ss));
    } else if (v === V.oe) {
      add(make(l, V.wae, 0), "ending");
      add(make(l, V.wae, T.ss));
    } else {
      add(make(l, v, T.ss));
    }
    closeSyllable(v);
    return forms;
  }

  if (t === 17 && !BIEUP_REGULAR.test(stem)) {
    // ㅂ-неправильные: 어렵다 → 어려워/어려운, 돕다 → 도와/도운
    const open = make(l, v, 0);
    const wa = v === V.o;
    add(open + (wa ? "와" : "워"), "ending");
    add(open + (wa ? "왔" : "웠"));
    add(`${open}운`, "break");
    add(`${open}울`, "break");
    add(`${open}우`);
    return forms;
  }

  if (t === 7 && DIGEUT_IRREGULAR.test(stem)) {
    // ㄷ-неправильные: 듣다 → 들어/들은, 걷다 → 걸어
    const open = make(l, v, T.l);
    const vowel = bright(v) ? "아" : "어";
    add(`${open}${vowel}`, "ending");
    add(`${open}${bright(v) ? "았" : "었"}`);
    // 물은 / 물을 у 묻다 совпадают с «вода + частица»: определительные формы пропускаем.
    if (stem !== "묻") {
      add(`${open}은`, "break");
      add(`${open}을`, "break");
    }
    add(`${open}으`);
    return forms;
  }

  if (t === 19 && SIOT_IRREGULAR.test(stem)) {
    // ㅅ-неправильные: 낫다 → 나아/나은, 짓다 → 지어/지은
    const open = make(l, v, 0);
    const vowel = bright(v) ? "아" : "어";
    add(`${open}${vowel}`, "ending");
    add(`${open}${bright(v) ? "았" : "었"}`);
    add(`${open}은`, "break");
    add(`${open}을`, "break");
    add(`${open}으`);
    return forms;
  }

  if (t === T.h && HIEUT_IRREGULAR.test(stem)) {
    // ㅎ-неправильные: 그렇다 → 그래/그런, 파랗다 → 파래/파란, 하얗다 → 하얘/하얀
    const vowel = v === V.ya ? V.yae : V.ae;
    add(make(l, vowel, 0), "ending");
    add(make(l, vowel, T.ss));
    add(make(l, v, T.n), "break");
    add(make(l, v, T.l), "break");
    const open = make(l, v, 0);
    add(`${open}면`, "any", (head + open).length);
    add(`${open}니`, "any", (head + open).length);
    return forms;
  }

  if (t === T.l) {
    // ㄹ выпадает: 살다 → 사는/삽니다, 만들다 → 만드는/만드세요
    const open = make(l, v, 0);
    // 주는, 나는, 자는… у однослоговых основ совпадают с формами 주다, 나 + 는, 자다.
    if (!head && COMMON_OPEN_SYLLABLES.has(open)) return forms;
    const chip = (head + open).length;
    add(`${open}는`, "any", chip);
    add(`${open}세요`, "any", chip);
    if (head) {
      add(`${open}니까`, "any", chip);
      add(make(l, v, T.n), "break");
      addWhole(head + make(l, v, T.b) + "니", "any", head.length + 1);
    }
    return forms;
  }

  return forms;
}
