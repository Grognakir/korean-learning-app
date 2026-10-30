import { COLORS, PATTERNS, type ColorId, type PatternId } from "../clothing/colors";
import { ITEM_BY_ID, itemPattern } from "../clothing/items";
import type { OutfitPiece } from "../clothing/situations";

export type PurchaseResult =
  | { kind: "ok"; piece: OutfitPiece }
  | { kind: "needColor"; id: string }
  | { kind: "unknown" }
  | { kind: "foreign"; lang: "ru" | "en" };

/** Разговорные и сокращённые названия цветов → id. Длинные формы идут
 * раньше коротких, чтобы «검은색» не разобралось как «검은». */
const COLOR_WORDS: [string, ColorId][] = [
  ...COLORS.map((c) => [c.ko, c.id] as [string, ColorId]),
  ["까만색", "black"],
  ["검정색", "black"],
  ["하얀색", "white"],
  ["하양", "white"],
  ["까만", "black"],
  ["검은", "black"],
  ["검정", "black"],
  ["하얀", "white"],
  ["흰", "white"],
  ["빨간", "red"],
  ["노란", "yellow"],
  ["파란", "blue"],
  ["까망", "black"],
].sort((a, b) => b[0].length - a[0].length) as [string, ColorId][];

const ITEM_ALIASES: Record<string, string> = { 양복: "suit", 셔츠: "dress_shirt", 신사화: "dress_shoes" };

/** «까만 정장 주세요» → вещь из ассортимента с цветом и узором. */
export function parsePurchase(input: string, assortment: string[]): PurchaseResult {
  let text = input.replace(/\s+/g, " ").trim();

  // Без хангыля продавец отвечает, что не говорит на этом языке.
  if (!/[\uac00-\ud7a3\u3131-\u318e]/.test(text)) {
    const cyrillic = (text.match(/[а-яё]/gi) ?? []).length;
    const latin = (text.match(/[a-z]/gi) ?? []).length;
    if (cyrillic || latin) return { kind: "foreign", lang: cyrillic >= latin ? "ru" : "en" };
  }

  const names: [string, string][] = [
    ...assortment.map((id) => [ITEM_BY_ID[id].ko, id] as [string, string]),
    ...Object.entries(ITEM_ALIASES).filter(([, id]) => assortment.includes(id)),
  ].sort((a, b) => b[0].length - a[0].length);
  const item = names.find(([ko]) => text.includes(ko));
  if (!item) return { kind: "unknown" };
  text = text.replace(item[0], " ");

  const pattern: PatternId =
    PATTERNS.filter((p) => p.id !== "plain").find((p) => text.includes(p.ko))?.id ?? "plain";
  const color = COLOR_WORDS.find(([ko]) => text.includes(ko))?.[1];

  const it = ITEM_BY_ID[item[1]];
  if (it.recolorable && !color) return { kind: "needColor", id: it.id };
  return {
    kind: "ok",
    piece: {
      id: it.id,
      color: it.recolorable && color ? color : "white",
      pattern: itemPattern(it, pattern),
    },
  };
}
