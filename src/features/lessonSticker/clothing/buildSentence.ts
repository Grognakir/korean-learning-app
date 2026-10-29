import { COLOR_BY_ID, PATTERN_BY_ID, type ColorId, type PatternId } from "./colors";
import { ITEM_BY_ID, SLOT_ORDER, type VerbId } from "./items";
import { TARGETS, type OutfitPiece, type Situation } from "./situations";

export const VERB_ORDER: VerbId[] = ["입다", "매다", "하다", "두르다", "쓰다", "끼다", "차다", "메다", "신다"];

const FORMS: Record<VerbId, { go: string; yo: string; seyo: string }> = {
  입다: { go: "입고", yo: "입어요", seyo: "입으세요" },
  신다: { go: "신고", yo: "신어요", seyo: "신으세요" },
  쓰다: { go: "쓰고", yo: "써요", seyo: "쓰세요" },
  매다: { go: "매고", yo: "매요", seyo: "매세요" },
  하다: { go: "하고", yo: "해요", seyo: "하세요" },
  두르다: { go: "두르고", yo: "둘러요", seyo: "두르세요" },
  끼다: { go: "끼고", yo: "껴요", seyo: "끼세요" },
  차다: { go: "차고", yo: "차요", seyo: "차세요" },
  메다: { go: "메고", yo: "메요", seyo: "메세요" },
};

export function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

export function objectParticle(word: string): string {
  return hasBatchim(word) ? "을" : "를";
}

/** «남색 줄무늬 넥타이»: цвет и узор только там, где вещь их принимает. */
export function describePiece(piece: OutfitPiece): string {
  const item = ITEM_BY_ID[piece.id];
  const words: string[] = [];
  if (item.recolorable) words.push(COLOR_BY_ID[piece.color].ko);
  if (item.patternable && piece.pattern !== "plain") words.push(PATTERN_BY_ID[piece.pattern].ko);
  words.push(item.ko);
  return words.join(" ");
}

const COLOR_RU_GEN: Record<ColorId, string> = {
  white: "белого",
  black: "чёрного",
  gray: "серого",
  navy: "тёмно-синего",
  brown: "коричневого",
  red: "красного",
  orange: "оранжевого",
  yellow: "жёлтого",
  green: "зелёного",
  blue: "синего",
  purple: "фиолетового",
  pink: "розового",
};

const PATTERN_RU: Record<PatternId, string> = {
  plain: "",
  stripes: "в полоску",
  check: "в клетку",
  floral: "в цветочек",
  dots: "в горошек",
};

/** «костюм жёлтого цвета в полоску» — без согласования по роду. */
export function describePieceRu(piece: OutfitPiece): string {
  const item = ITEM_BY_ID[piece.id];
  const words = [item.ru];
  if (item.recolorable) words.push(`${COLOR_RU_GEN[piece.color]} цвета`);
  if (item.patternable && piece.pattern !== "plain") words.push(PATTERN_RU[piece.pattern]);
  return words.join(" ");
}

/** verbs — выбранный глагол для каждой вещи (по id); без него берётся
 * первый глагол вещи. */
export function buildSentence(
  situation: Situation,
  outfit: OutfitPiece[],
  verbs: Record<string, VerbId> = {},
): string {
  const target = TARGETS[situation.target];

  if (situation.kind === "gift") {
    const noun = describePiece(outfit[0]);
    return `${target.dative ?? ""} ${noun}${objectParticle(noun)} 드려요.`.trim();
  }

  const slotRank = (id: string) => SLOT_ORDER.indexOf(ITEM_BY_ID[id].slot);
  const fullFirst = (id: string) => (ITEM_BY_ID[id].slot === "full" ? -1 : slotRank(id));
  const groups = new Map<VerbId, OutfitPiece[]>();
  for (const piece of [...outfit].sort((a, b) => fullFirst(a.id) - fullFirst(b.id))) {
    const verb = verbs[piece.id] ?? ITEM_BY_ID[piece.id].verbs[0];
    groups.set(verb, [...(groups.get(verb) ?? []), piece]);
  }

  const ordered = VERB_ORDER.filter((v) => groups.has(v));
  const clauses = ordered.map((verb, i) => {
    const nouns = groups.get(verb)!.map(describePiece);
    const last = nouns[nouns.length - 1];
    const joined = [...nouns.slice(0, -1).map((n) => `${n}하고`), `${last}${objectParticle(last)}`].join(" ");
    const isLast = i === ordered.length - 1;
    const form = isLast ? (target.elder ? FORMS[verb].seyo : FORMS[verb].yo) : FORMS[verb].go;
    return `${joined} ${form}`;
  });

  return `${target.topic} ${clauses.join(" ")}.`;
}
