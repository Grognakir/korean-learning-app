import type { PatternId } from "./colors";

export type Slot =
  | "top"
  | "bottom"
  | "full"
  | "outer"
  | "shoes"
  | "head"
  | "neck"
  | "hands"
  | "other";

export type VerbId = "입다" | "신다" | "쓰다" | "매다" | "하다" | "두르다" | "끼다" | "차다" | "메다";

export type ClothingItem = {
  id: string;
  ko: string;
  ru: string;
  slot: Slot;
  /** Есть маска *_fabric.png и готовые цветные версии. */
  recolorable: boolean;
  /** Узоры, которые у такой вещи бывают в жизни (кроме 민무늬). */
  patterns: Exclude<PatternId, "plain">[];
  patternable: boolean;
  /** Глаголы ношения; первый идёт в собранную фразу. */
  verbs: VerbId[];
};

const item = (
  id: string,
  ko: string,
  ru: string,
  slot: Slot,
  verbs: VerbId[],
  patterns: Exclude<PatternId, "plain">[] = [],
  recolorable = true,
): ClothingItem => ({ id, ko, ru, slot, verbs, recolorable, patterns, patternable: patterns.length > 0 });

export const ITEMS: ClothingItem[] = [
  item("dress_shirt", "와이셔츠", "рубашка", "top", ["입다"], ["stripes", "check"]),
  item("tshirt", "티셔츠", "футболка", "top", ["입다"], ["stripes", "dots"]),
  item("blouse", "블라우스", "блузка", "top", ["입다"], ["stripes", "floral", "dots"]),
  item("pants", "바지", "брюки", "bottom", ["입다"], ["stripes", "check"]),
  item("jeans", "청바지", "джинсы", "bottom", ["입다"], [], false),
  item("skirt", "치마", "юбка", "bottom", ["입다"], ["check", "floral", "dots"]),
  item("shorts", "반바지", "шорты", "bottom", ["입다"], ["stripes", "check", "floral"]),
  item("suit", "정장", "костюм", "full", ["입다"], ["stripes", "check"]),
  item("dress", "원피스", "платье", "full", ["입다"], ["stripes", "check", "floral", "dots"]),
  item("tracksuit", "운동복", "спортивный костюм", "full", ["입다"]),
  item("hiking_wear", "등산복", "одежда для походов", "full", ["입다"]),
  item("hanbok", "한복", "ханбок", "full", ["입다"], ["floral"]),
  item("school_uniform", "교복", "школьная форма", "full", ["입다"], ["check"]),
  item("swimsuit", "수영복", "купальник", "full", ["입다"], ["stripes", "floral", "dots"]),
  item("jacket", "재킷", "пиджак", "outer", ["입다"], ["stripes", "check"]),
  item("coat", "코트", "пальто", "outer", ["입다"], ["check"]),
  item("padded_jacket", "점퍼", "куртка", "outer", ["입다"]),
  item("vest", "조끼", "жилет", "outer", ["입다"], ["check"]),
  item("raincoat", "비옷", "дождевик", "outer", ["입다"], ["dots"]),
  item("dress_shoes", "구두", "туфли", "shoes", ["신다"]),
  item("sneakers", "운동화", "кроссовки", "shoes", ["신다"]),
  item("boots", "부츠", "сапоги", "shoes", ["신다"]),
  item("hiking_boots", "등산화", "треккинговые ботинки", "shoes", ["신다"]),
  item("slippers", "슬리퍼", "шлёпанцы", "shoes", ["신다"]),
  item("socks", "양말", "носки", "shoes", ["신다"], ["stripes", "dots"]),
  item("hat", "모자", "кепка", "head", ["쓰다"], ["check"]),
  item("glasses", "안경", "очки", "head", ["쓰다"], [], false),
  item("tie", "넥타이", "галстук", "neck", ["매다"], ["stripes", "check", "dots"]),
  item("muffler", "목도리", "шарф", "neck", ["하다", "두르다"], ["stripes", "check"]),
  item("scarf", "스카프", "платок", "neck", ["하다", "두르다"], ["check", "floral", "dots"]),
  item("gloves", "장갑", "перчатки", "hands", ["끼다"]),
  item("ring", "반지", "кольцо", "hands", ["끼다"], [], false),
  item("watch", "시계", "часы", "hands", ["차다"]),
  item("bag", "가방", "рюкзак", "other", ["메다"], ["check"]),
  item("earrings", "귀걸이", "серьги", "other", ["하다"], [], false),
];

/** Узор, который действительно бывает у вещи; иначе — 민무늬. */
export function itemPattern(it: ClothingItem, pattern: PatternId): PatternId {
  return pattern !== "plain" && it.patterns.includes(pattern) ? pattern : "plain";
}

export const ITEM_BY_ID: Record<string, ClothingItem> = Object.fromEntries(
  ITEMS.map((it) => [it.id, it]),
);

export const SLOT_LABELS: Record<Slot, string> = {
  top: "Верх",
  bottom: "Низ",
  full: "Целиком",
  outer: "Верхняя одежда",
  shoes: "Обувь",
  head: "Голова",
  neck: "Шея",
  hands: "Руки",
  other: "Прочее",
};

export const SLOT_ORDER: Slot[] = [
  "top",
  "bottom",
  "full",
  "outer",
  "shoes",
  "head",
  "neck",
  "hands",
  "other",
];

/** Целые наряды, под которые не надевают отдельный верх (костюм — можно,
 * под него нужна рубашка). */
const FULL_COVERS_TOP = new Set([
  "dress",
  "tracksuit",
  "hiking_wear",
  "hanbok",
  "school_uniform",
  "swimsuit",
]);

/** Группа, в которой может быть выбрана только одна вещь; null — вещей
 * может быть несколько (аксессуары). Носки отдельно от обуви. */
export function exclusiveGroup(it: ClothingItem): string | null {
  if (it.id === "socks") return "socks";
  if (["top", "bottom", "full", "outer", "shoes"].includes(it.slot)) return it.slot;
  return null;
}

/** Вещи, которые нельзя носить вместе с it (кроме своей группы). */
export function conflictsWith(it: ClothingItem, other: ClothingItem): boolean {
  if (it.slot === "full" && other.slot === "bottom") return true;
  if (other.slot === "full" && it.slot === "bottom") return true;
  if (it.slot === "full" && other.slot === "top" && FULL_COVERS_TOP.has(it.id)) return true;
  if (other.slot === "full" && it.slot === "top" && FULL_COVERS_TOP.has(other.id)) return true;
  return false;
}

export const ICON_BASE = "/images/clothing-game/prod/icons";
/** Готовые цветные версии вещей: colored/<id>/<color>.webp. */
/** Маски узоров по крою вещи: patterns/<id>/<pattern>.png (альфа = метка). */
export const PATTERN_BASE = "/images/clothing-game/prod/patterns";
export const COLORED_BASE = "/images/clothing-game/prod/colored";
export const AVATAR_BASE = "/images/clothing-game/prod/avatars";
