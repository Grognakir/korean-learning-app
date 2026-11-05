import type { DocumentSection } from "../documents/types";
import { COLORS, PATTERNS } from "../../lessonSticker/clothing/colors";
import { FORMS, VERB_ORDER } from "../../lessonSticker/clothing/buildSentence";
import { ICON_BASE, ITEMS, SLOT_LABELS, SLOT_ORDER, type VerbId } from "../../lessonSticker/clothing/items";

export type Word = { id: string; group: "color" | "item" | "verb" | "pattern" | "personal"; ko: string; ru: string; accept: string[] };
export type { DocumentSection } from "../documents/types";
export type WordTopic = { id: string; titleKo: string; titleRu: string; words: Word[]; document: DocumentSection[] };

const VERBS: Record<VerbId, { ru: string; accept: string[] }> = {
  입다: { ru: "надевать (одежду)", accept: ["надевать", "надеть", "одевать", "носить", "надевать одежду", "носить одежду"] },
  신다: { ru: "обувать (обувь, носки)", accept: ["обувать", "обуть", "надевать обувь", "носить обувь"] },
  쓰다: { ru: "надевать на голову или лицо", accept: ["надевать на голову", "надевать шапку", "надевать очки", "носить на голове"] },
  매다: { ru: "повязывать (галстук)", accept: ["повязывать", "завязывать", "повязывать галстук"] },
  하다: { ru: "надевать (аксессуар)", accept: ["надевать аксессуар", "надевать украшение", "носить аксессуар"] },
  두르다: { ru: "обматывать, повязывать (шарф)", accept: ["обматывать", "повязывать шарф", "обворачивать"] },
  끼다: { ru: "надевать на пальцы и руки", accept: ["надевать кольцо", "надевать перчатки", "надевать на пальцы", "надевать на руки"] },
  차다: { ru: "носить на запястье или поясе", accept: ["носить на запястье", "надевать часы", "носить на поясе"] },
  메다: { ru: "носить на плече или за спиной", accept: ["носить на плече", "носить за спиной", "надевать рюкзак"] },
};
const PATTERN_ANSWERS: Record<string, string[]> = {
  plain: ["однотонный", "без узора", "одноцветный"], stripes: ["полоска", "полоски", "в полоску"],
  check: ["клетка", "клетки", "в клетку"], floral: ["цветы", "цветочек", "в цветочек"], dots: ["горошек", "в горошек"],
};
const ITEM_ANSWERS: Record<string, string[]> = {
  bag: ["сумка"], hat: ["шапка", "шляпа", "головной убор"], jacket: ["жакет"], padded_jacket: ["ветровка", "куртка"],
  raincoat: ["плащ", "дождевик"], dress_shoes: ["ботинки"], tracksuit: ["спортивная одежда"], suit: ["костюм"], dress_shirt: ["сорочка"],
};
const PLURALS: Record<string, string> = {
  рубашка: "рубашки", футболка: "футболки", блузка: "блузки", юбка: "юбки", костюм: "костюмы", платье: "платья",
  "спортивный костюм": "спортивные костюмы", ханбок: "ханбоки", "школьная форма": "школьные формы", купальник: "купальники",
  пиджак: "пиджаки", куртка: "куртки", жилет: "жилеты", дождевик: "дождевики", кепка: "кепки", галстук: "галстуки",
  шарф: "шарфы", платок: "платки", кольцо: "кольца", рюкзак: "рюкзаки", сумка: "сумки", шапка: "шапки", шляпа: "шляпы",
  "головной убор": "головные уборы", жакет: "жакеты", ветровка: "ветровки", плащ: "плащи", сорочка: "сорочки", цветочек: "цветочки",
};
function word(group: Word["group"], id: string, ko: string, ru: string, accept: string[] = []): Word {
  const answers = [ru.replace(/\s*\([^)]*\)/g, "").trim(), ...accept];
  const plurals = answers.flatMap((answer) => PLURALS[answer] ? [PLURALS[answer]] : /(?:ый|ий)$/.test(answer) ? [answer.replace(/ый$/, "ые").replace(/ий$/, "ие")] : []);
  return { id: `${group}:${id}`, group, ko, ru, accept: [...new Set([...answers, ...plurals])] };
}
const EXAMPLES = [
  ["저는 흰색 와이셔츠를 입어요.", "Я ношу белую рубашку."],
  ["검은색 바지를 입어요.", "Я надеваю чёрные брюки."],
  ["분홍색 원피스를 입어요.", "Я надеваю розовое платье."],
  ["회색 코트를 입어요.", "Я надеваю серое пальто."],
  ["갈색 구두를 신어요.", "Я надеваю коричневые туфли."],
  ["흰색 운동화를 신어요.", "Я надеваю белые кроссовки."],
  ["파란색 모자를 써요.", "Я надеваю синюю кепку."],
  ["안경을 써요.", "Я надеваю очки."],
  ["남색 넥타이를 매요.", "Я повязываю тёмно-синий галстук."],
  ["빨간색 목도리를 둘러요.", "Я повязываю красный шарф."],
  ["초록색 스카프를 해요.", "Я надеваю зелёный платок."],
  ["반지를 껴요.", "Я надеваю кольцо."],
  ["시계를 차요.", "Я ношу часы."],
  ["검은색 가방을 메요.", "Я ношу чёрный рюкзак."],
] as const;

export const TOPICS: WordTopic[] = [{
  id: "clothes", titleKo: "옷과 색깔", titleRu: "Одежда и цвета",
  words: [
    ...COLORS.map((c) => word("color", c.id, c.ko, c.ru)),
    ...ITEMS.map((i) => word("item", i.id, i.ko, i.ru, ITEM_ANSWERS[i.id])),
    ...VERB_ORDER.map((v) => word("verb", v, v, VERBS[v].ru, VERBS[v].accept)),
    ...PATTERNS.map((p) => word("pattern", p.id, p.ko, p.ru, PATTERN_ANSWERS[p.id])),
  ],
  document: [
    { id: "colors", titleKo: "색깔", titleRu: "Цвета", groups: [{ id: "colors", rows: COLORS }] },
    { id: "clothes", titleKo: "옷", titleRu: "Одежда", groups: SLOT_ORDER.map((slot) => ({ id: slot, title: SLOT_LABELS[slot],
      rows: ITEMS.filter((i) => i.slot === slot).map((i) => ({ id: i.id, ko: i.ko, ru: i.ru, detailKo: i.verbs[0], icon: `${ICON_BASE}/${i.id}.png` })) })) },
    { id: "verbs", titleKo: "동사", titleRu: "Глаголы ношения", groups: [{ id: "verbs", rows: VERB_ORDER.map((ko) => ({ id: ko, ko,
      ru: VERBS[ko].ru, detailKo: FORMS[ko].yo, usageKo: ITEMS.filter((i) => i.verbs[0] === ko).map((i) => i.ko).join(", ") })) }] },
    { id: "patterns", titleKo: "무늬", titleRu: "Узоры", groups: [{ id: "patterns", rows: PATTERNS }] },
    { id: "examples", titleKo: "예문", titleRu: "Примеры", groups: [{ id: "examples", rows: EXAMPLES.map(([ko, ru], i) => ({ id: String(i), ko, ru })) }] },
  ],
}, { id: "personal", titleKo: "내 단어장", titleRu: "Мой словарь", words: [], document: [] }];
export const topicById = (id: string) => TOPICS.find((topic) => topic.id === id);
export const wordById = (topic: WordTopic, id: string) => topic.words.find((entry) => entry.id === id)!;
