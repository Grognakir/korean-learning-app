export type ColorId =
  | "white"
  | "black"
  | "gray"
  | "navy"
  | "brown"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export type ClothingColor = {
  id: ColorId;
  ko: string;
  ru: string;
  /** Цвет светлых мест ткани; тени — более тёмный оттенок того же цвета
   * (см. recolorIcon). Чёрный — не #000, иначе пропадает объём. */
  hex: string;
};

export const COLORS: ClothingColor[] = [
  { id: "white", ko: "흰색", ru: "белый", hex: "#ffffff" },
  { id: "black", ko: "검은색", ru: "чёрный", hex: "#2b2b2b" },
  { id: "gray", ko: "회색", ru: "серый", hex: "#9e9e9e" },
  { id: "navy", ko: "남색", ru: "тёмно-синий", hex: "#2f4a8f" },
  { id: "brown", ko: "갈색", ru: "коричневый", hex: "#8a5a3b" },
  { id: "red", ko: "빨간색", ru: "красный", hex: "#e53935" },
  { id: "orange", ko: "주황색", ru: "оранжевый", hex: "#fb8c00" },
  { id: "yellow", ko: "노란색", ru: "жёлтый", hex: "#fdd835" },
  { id: "green", ko: "초록색", ru: "зелёный", hex: "#43a047" },
  { id: "blue", ko: "파란색", ru: "синий", hex: "#1e88e5" },
  { id: "purple", ko: "보라색", ru: "фиолетовый", hex: "#8e44ad" },
  { id: "pink", ko: "분홍색", ru: "розовый", hex: "#f48fb1" },
];

export const COLOR_BY_ID = Object.fromEntries(COLORS.map((c) => [c.id, c])) as Record<
  ColorId,
  ClothingColor
>;

/** 어두운 색 */
export const DARK: ColorId[] = ["black", "gray", "navy", "brown"];
/** 밝은 색 / 화사한 색 */
export const BRIGHT: ColorId[] = ["red", "orange", "yellow", "green", "blue", "purple", "pink"];

export type PatternId = "plain" | "stripes" | "check" | "floral" | "dots";

export const PATTERNS: { id: PatternId; ko: string; ru: string }[] = [
  { id: "plain", ko: "민무늬", ru: "однотонный" },
  { id: "stripes", ko: "줄무늬", ru: "полоска" },
  { id: "check", ko: "체크무늬", ru: "клетка" },
  { id: "floral", ko: "꽃무늬", ru: "цветы" },
  { id: "dots", ko: "물방울무늬", ru: "горошек" },
];

export const PATTERN_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p])) as Record<
  PatternId,
  (typeof PATTERNS)[number]
>;

/** Цвет меток узора (RGBA 0–255): на светлой ткани — тёмный оттенок того же
 * цвета (на белой — тёмно-синий), на тёмной — светлый. */
export function patternInk(color: ColorId): [number, number, number, number] {
  if (color === "white") return [47, 74, 143, 220];
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(COLOR_BY_ID[color].hex.slice(i, i + 2), 16));
  if (["yellow", "pink", "orange", "gray"].includes(color))
    return [r * 0.45, g * 0.45, b * 0.45, 230];
  return [r + (255 - r) * 0.88, g + (255 - g) * 0.88, b + (255 - b) * 0.88, 235];
}
