// Одноразовый (но коммитится ради воспроизводимости) перенос словаря из
// соседнего проекта korean_flashcards/data/words.json в схему словаря
// этого приложения. См. docs/dev_docs/3-dictionary-and-learning.md §1 и
// план в .claude/plans (раздел «Словарь»).
//
// Источник: 41 категория, ~1647 записей {kr, translit, meaning, notes,
// related, examples, forms}. У 64 kr-значений есть дубликаты в разных
// категориях — они разбираются на три группы (см. ниже): настоящие
// повторы одного слова (схлопываются в одну запись словаря с несколькими
// категориями), совпадающие по смыслу записи с чуть разной формулировкой
// перевода (форс-мёрдж по явному списку) и настоящие омонимы (остаются
// отдельными записями).

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_PATH = join(
  process.cwd(),
  "../korean_flashcards/data/words.json",
);
const OUTPUT_PATH = join(process.cwd(), "content/dictionary/words.json");

type SourceExample = { kr: string; ru: string; form?: string };
type SourceForm = { label: string; value: string };
type SourceRelated = { type: string; target: string };
type SourceWord = {
  kr: string;
  translit: string;
  meaning: string;
  notes?: string | null;
  related?: SourceRelated | null;
  examples: SourceExample[];
  forms?: SourceForm[];
};
type SourceCategory = { category: string; words: SourceWord[] };

// kr-значения, где два появления в источнике — одно и то же слово, но
// meaning отличается только формулировкой в скобках (проверено вручную,
// см. план) — форсируем слияние в одну запись словаря вопреки тому, что
// точное сравнение строк их не схлопывает.
const FORCE_MERGE_KR = new Set(["놀다", "들다", "그립다", "힘들다"]);

// Часть речи — не выводится из категории источника (в категории может
// быть что угодно, не только грамматический класс), а определяется по
// каждому слову отдельно. Единственное исключение — категории "Глаголы"
// и "Прилагательные": их названия сами и есть часть речи, а не
// тематическая метка, поэтому использовать факт принадлежности к ним
// как признак — не то же самое, что гадать "эта тема — значит, скорее
// всего, существительное".
type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "numeral"
  | "counter"
  | "particle"
  | "conjunction"
  | "connective_ending"
  | "question_word"
  | "determiner"
  | "interjection";

// Явные точечные исключения, где ни категория (Глаголы/Прилагательные),
// ни грамматические категории-списки (Местоимения, Частицы и т.п.), ни
// тематический дефолт "noun" не дают правильный ответ — разобраны
// вручную по каждому слову (см. план: разбор категорий "Прочее",
// "Семья и обращения", "Наречия", "Местоимения", "Разговорные выражения",
// плюс 3 неправильных глагола без пары в "Глаголы").
const EXPLICIT_POS_OVERRIDES: Record<string, PartOfSpeech> = {
  // "Прочее" — единичные не-существительные в тематической категории.
  여러: "determiner",
  안녕히: "adverb",
  본: "determiner",
  찰칵: "interjection",
  뵙다: "verb",
  // "Наречия (образа действия)" — 값 туда явно попал по ошибке источника.
  값: "noun",
  // "Семья и обращения" — вежливые частицы и вежливые формы глаголов.
  께서: "particle",
  께: "particle",
  드리다: "verb",
  계시다: "verb",
  주무시다: "verb",
  말씀하시다: "verb",
  돌아가시다: "verb",
  드시다: "verb",
  // "Разговорные выражения" — не тематические существительные вовсе.
  네: "interjection",
  아니요: "interjection",
  감사하다: "adjective",
  미안하다: "adjective",
  // "Местоимения" — определители, а не собственно местоимения. "이" —
  // омоним с "зуб" (Части тела) и "два" (Числительные), override ниже
  // применяется только к сущностям из категории "Местоимения" отдельно.
  이런: "determiner",
  // "Неправильные глаголы/прилагательные" без пары в Глаголы/Прилагательные.
  깨닫다: "verb",
  자르다: "verb",
  고르다: "verb",
};

const GRAMMAR_CATEGORY_POS: Record<string, PartOfSpeech | null> = {
  Местоимения: "pronoun",
  "Вопросительные слова": "question_word",
  Числительные: "numeral",
  Частицы: "particle",
  "Союзы и связки": "conjunction",
  "Соединительные окончания (연결어미)": "connective_ending",
  "Счётные слова (의존명사)": "counter",
  "Наречия (образа действия)": "adverb",
  "Временные наречия": "adverb",
  "Грамматические термины": null,
};

const RELATED_TYPE_LABEL: Record<string, string> = {
  antonym: "антоним",
  synonym: "синоним",
};

// Заметки почти всегда УЖЕ упоминают антоним/синоним прозой ("антоним:
// 켜다") — та же информация показывается отдельным блоком (word_forms,
// label="антоним"/"синоним"), так что фразу вырезаем, чтобы не дублировать.
// Проверено на всех 187 словах с related: 176 — чистая констатация факта
// в стандартной форме "антоним: X"/"синоним X", регэксп режет их
// безопасно. Оставшиеся 11 разобраны вручную (см. ниже) — часть просто
// переформулирована без повтора слова, часть оставлена как есть (заметка
// несёт больше смысла, чем просто "у слова есть антоним/синоним X" —
// сравнение, оговорка о неточности соответствия, второй антоним и т.п.,
// резать её нельзя без потери информации).
function stripRelatedMention(
  note: string,
  relType: string,
  target: string,
): string | null {
  const label = RELATED_TYPE_LABEL[relType];
  if (!label) return null;
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|(?<=[;.,]))\\s*${label}\\s*[:—-]?\\s*${escaped}(\\s*\\([^)]*\\))?\\s*(?=[;.,]|$)`,
  );
  if (!pattern.test(note)) return null;
  let result = note.replace(pattern, "");
  for (let i = 0; i < 3; i++) {
    result = result.replace(/([;,.])\s*[;,]/g, "$1");
  }
  return result
    .replace(/^[;,.\s]+/, "")
    .replace(/[;,.\s]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Ручная зачистка для случаев, где формулировка нестандартна и регэксп
// выше не находит паттерн, но по сути это тоже чистая констатация факта
// без доп. смысла (см. комментарий выше).
const NOTE_OVERRIDES: Record<string, string> = {
  공부하다: "배우다 про освоение нового, 공부하다 про сам процесс учёбы",
  시키다: "как «заказывать еду» — более разговорный",
  주문하다: "в контексте еды/услуг",
  끝: "существительное; связанный глагол — 끝내다 (заканчивать)",
  시작: "существительное; связанный глагол — 시작하다 (начинать)",
};

// Правила спряжения вида "ㅂ→우+어요: 가까워요" (стрелка ДО двоеточия) —
// переформатируем в "ㅂ → 우+어요 = 가까워요" (пробелы вокруг стрелки,
// двоеточие → знак равенства перед результатом) — UI подчёркивает
// результат так же, как в "Формах". Срабатывает только когда стрелка
// стоит до первого двоеточия — не трогает описательные предложения вида
// "ㄷ-неправильный глагол: основа меняется 걷다 → 걸어요" (там двоеточие
// раньше стрелки, это другая структура).
function reformatArrowRule(note: string): string | null {
  const match = note.match(/^([^:]*→[^:]*):\s*(.+)$/);
  if (!match) return null;
  const rule = match[1].replace(/\s*→\s*/g, " → ").replace(/\s{2,}/g, " ").trim();
  const rest = match[2];
  const semiIndex = rest.indexOf(";");
  const result = (semiIndex === -1 ? rest : rest.slice(0, semiIndex)).trim();
  const tail = semiIndex === -1 ? "" : rest.slice(semiIndex);
  return `${rule} = ${result}${tail}`;
}

// Примечания вида "слово1 — перевод1; слово2 — перевод2" (несколько
// независимых примеров употребления, склеенных через ";") — разбиваем на
// отдельные пункты списка. Срабатывает только когда КАЖДЫЙ сегмент до
// точки разрыва — это чистая пара "корейское слово/фраза — перевод" (левая
// часть начинается с хангыля/цифры), а не пояснение вроде "омоним..."/
// "не путать..."/"связанный глагол..." — те остаются слитыми в одну
// заметку, чтобы не оторвать оговорку от примера, к которому она относится.
function isCleanExampleSegment(segment: string): boolean {
  if (!segment.includes("—")) return false;
  const left = segment.split("—", 1)[0].trim();
  return /^[가-힣0-9]/.test(left);
}

function splitExampleList(note: string): string[] {
  const segments = note.split(";").map((s) => s.trim());
  if (segments.length < 2) return [note];
  let i = 0;
  while (i < segments.length && isCleanExampleSegment(segments[i])) i++;
  if (i < 2) return [note];
  const result = segments.slice(0, i);
  const trailing = segments.slice(i);
  if (trailing.length > 0) result.push(trailing.join("; "));
  return result;
}

// Короткие отображаемые имена вместо слишком длинных названий категорий
// источника (не влияют на классификацию part_of_speech — та работает по
// исходным именам, см. использование ниже до применения этой карты).
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  "Неправильные глаголы/прилагательные — ㄷ (ㄷ받침 → ㄹ перед гласной)":
    "Неправильные ㄷ받침",
  "Неправильные глаголы/прилагательные — ㄹ받침 (ведут себя по-другому только в некоторых окончаниях)":
    "Неправильные ㄹ받침",
  "Неправильные глаголы/прилагательные — ㅂ (ㅂ받침 → 우/오 перед гласной)":
    "Неправильные ㅂ받침",
  "Неправильные глаголы/прилагательные — ㅡ (выпадение гласной + отдельно 르-неправильные)":
    "Неправильные ㅡ/르",
  "Соединительные окончания (연결어미)": "Соединительные окончания",
  "Счётные слова (의존명사)": "Счётные слова",
};

function displayCategoryName(name: string): string {
  return CATEGORY_DISPLAY_NAMES[name] ?? name;
}

function partOfSpeech(
  kr: string,
  categories: Set<string>,
): PartOfSpeech | null {
  // "이" — единственный омоним среди точечных исключений: как определитель
  // ("этот") он попадает в "Местоимения", но также существует отдельными
  // словами "зуб" (Части тела) и "два" (Числительные), для которых
  // override не должен применяться — там ниже сработает обычная логика.
  if (kr === "이" && categories.has("Местоимения")) return "determiner";
  if (kr !== "이" && kr in EXPLICIT_POS_OVERRIDES)
    return EXPLICIT_POS_OVERRIDES[kr];
  if (categories.has("Глаголы")) return "verb";
  if (categories.has("Прилагательные")) return "adjective";
  for (const cat of categories) {
    if (cat in GRAMMAR_CATEGORY_POS) return GRAMMAR_CATEGORY_POS[cat];
  }
  return "noun";
}

type RawOccurrence = { category: string; word: SourceWord; order: number };

function main() {
  const source: SourceCategory[] = JSON.parse(
    readFileSync(SOURCE_PATH, "utf-8"),
  );

  // Словарь — только корейские слова. В источнике есть один случай
  // латинской аббревиатуры (EMS — международная экспресс-почта),
  // затесавшейся в тематическую категорию "Прочее" — это не корейское
  // слово по сути, а название службы, пропускаем такие headword'ы.
  const HANGUL = /[가-힣]/;

  // Перевод антонима/синонима для отображения рядом с ним (см. related
  // ниже) — по первому вхождению этого kr в источнике; для не найденных
  // target (например, если он не сам по себе отдельное слово словаря)
  // перевод просто не добавляется, слово показывается без скобок.
  const krToMeaning = new Map<string, string>();
  for (const cat of source) {
    for (const word of cat.words) {
      if (!krToMeaning.has(word.kr)) krToMeaning.set(word.kr, word.meaning);
    }
  }

  const byKr = new Map<string, RawOccurrence[]>();
  let order = 0;
  for (const cat of source) {
    for (const word of cat.words) {
      if (!HANGUL.test(word.kr)) continue;
      const list = byKr.get(word.kr) ?? [];
      list.push({ category: cat.category, word, order: order++ });
      byKr.set(word.kr, list);
    }
  }

  const categoryNames = new Set<string>();
  const outputWords: unknown[] = [];

  for (const [kr, occurrences] of byKr) {
    // Группируем по точному meaning, кроме форс-мёрджа.
    const groups: RawOccurrence[][] = [];
    if (FORCE_MERGE_KR.has(kr)) {
      groups.push(occurrences);
    } else {
      const byMeaning = new Map<string, RawOccurrence[]>();
      for (const occ of occurrences) {
        const list = byMeaning.get(occ.word.meaning) ?? [];
        list.push(occ);
        byMeaning.set(occ.word.meaning, list);
      }
      groups.push(...byMeaning.values());
    }

    groups.forEach((group, groupIndex) => {
      const externalId =
        groups.length > 1 ? `word-${kr}-${groupIndex + 1}` : `word-${kr}`;

      // Каноническое meaning — самая длинная (подробная) формулировка
      // среди слитых вхождений (актуально для форс-мёрджа).
      const canonical = group.reduce((a, b) =>
        b.word.meaning.length > a.word.meaning.length ? b : a,
      );

      // Классификация part_of_speech работает по исходным именам категорий
      // (rawCategories) — GRAMMAR_CATEGORY_POS ниже завязан именно на них;
      // сокращённые имена нужны только для отображения.
      const rawCategories = Array.from(
        new Set(group.map((o) => o.category)),
      );
      const categories = rawCategories.map(displayCategoryName);
      categories.forEach((c) => categoryNames.add(c));

      const examples = group.flatMap((o) => o.word.examples);
      const dedupedExamples = Array.from(
        new Map(examples.map((e) => [`${e.kr}|${e.ru}`, e])).values(),
      ).map((e) => ({ kr: e.kr, ru: e.ru }));

      const notes = group
        .map((o) => {
          const raw = o.word.notes;
          if (!raw || !raw.trim()) return null;
          if (!o.word.related) return raw;
          const stripped = stripRelatedMention(
            raw,
            o.word.related.type,
            o.word.related.target,
          );
          if (stripped !== null) return stripped || null;
          return NOTE_OVERRIDES[kr] ?? raw;
        })
        .filter((n): n is string => Boolean(n && n.trim()))
        .flatMap((n) => splitExampleList(reformatArrowRule(n) ?? n));
      const uniqueNotes = Array.from(new Set(notes));

      const forms =
        group.find((o) => o.word.forms && o.word.forms.length > 0)?.word
          .forms ?? [];

      const related: { label: string; value: string }[] = [];
      for (const o of group) {
        if (o.word.related) {
          const target = o.word.related.target;
          const meaning = krToMeaning.get(target);
          related.push({
            label: RELATED_TYPE_LABEL[o.word.related.type] ?? o.word.related.type,
            value: meaning ? `${target} (${meaning})` : target,
          });
        }
      }

      outputWords.push({
        external_id: externalId,
        headword: kr,
        reading: canonical.word.translit,
        part_of_speech: partOfSpeech(kr, new Set(rawCategories)),
        level_tag: null,
        categories,
        translations: [canonical.word.meaning],
        examples: dedupedExamples,
        notes: uniqueNotes,
        forms,
        related,
      });
    });
  }

  const output = {
    categories: Array.from(categoryNames).sort(),
    words: outputWords,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `Слов на выходе: ${outputWords.length} (источник: ${Array.from(byKr.values()).reduce((n, l) => n + l.length, 0)} записей, категорий: ${output.categories.length})`,
  );
}

main();
