import boxes from "../../../../public/images/dialogue/mannequins/zones.json";
import { WOMENS } from "../clothing/checkOutfit";

export type MannequinKind = "male" | "female";

export type ZoneId = "head" | "face" | "neck" | "top" | "outer" | "hands" | "bottom" | "shoes" | "ears" | "bag";

/** Индекс зоны в красном канале карты *-zones.png (1–10). */
export const ZONE_BY_INDEX: (ZoneId | null)[] = [
  null,
  "head",
  "face",
  "neck",
  "top",
  "outer",
  "hands",
  "bottom",
  "shoes",
  "ears",
  "bag",
];

export const ZONES: Record<ZoneId, { ko: string; ru: string; items: string[] }> = {
  head: { ko: "모자", ru: "голова", items: ["hat"] },
  face: { ko: "안경", ru: "лицо", items: ["glasses"] },
  neck: { ko: "목", ru: "шея", items: ["tie", "muffler", "scarf"] },
  top: { ko: "상의", ru: "верх", items: ["dress_shirt", "tshirt", "blouse"] },
  outer: { ko: "겉옷", ru: "верхняя одежда", items: ["suit", "jacket", "coat", "padded_jacket", "vest"] },
  hands: { ko: "손목", ru: "руки", items: ["watch", "gloves", "ring"] },
  bottom: { ko: "하의", ru: "низ", items: ["suit", "pants", "jeans", "shorts", "skirt"] },
  shoes: { ko: "신발", ru: "обувь", items: ["dress_shoes", "sneakers", "boots", "slippers", "socks"] },
  ears: { ko: "귀걸이", ru: "уши", items: ["earrings"] },
  bag: { ko: "가방", ru: "сумка", items: ["bag"] },
};

export const MANNEQUIN_KO: Record<MannequinKind, string> = { male: "남성", female: "여성" };

/** Рамки зон в координатах картинки 512×768: [x, y, w, h]. */
export const ZONE_BOXES = boxes as Record<MannequinKind, Partial<Record<ZoneId, [number, number, number, number]>>>;

export const MANNEQUIN_SIZE = { width: 512, height: 768 };

const NOT_FOR_MEN = [...WOMENS, "earrings"];

/** Вещи зоны, которые есть в магазине; на мужском манекене без женских. */
export function zoneItems(kind: MannequinKind, zone: ZoneId, assortment: string[]): string[] {
  return ZONES[zone].items.filter(
    (id) => assortment.includes(id) && (kind === "female" || !NOT_FOR_MEN.includes(id)),
  );
}

export function mannequinSrc(kind: MannequinKind): string {
  return `/images/dialogue/mannequins/${kind}.webp`;
}

export function zonesSrc(kind: MannequinKind): string {
  return `/images/dialogue/mannequins/${kind}-zones.png`;
}
