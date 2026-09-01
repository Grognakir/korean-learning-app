export const FONT_KR_OPTIONS = [
  {
    value: "noto-sans-kr",
    label: "Noto Sans KR",
    cssVar: "var(--font-noto-sans-kr)",
  },
  {
    value: "noto-serif-kr",
    label: "Noto Serif KR",
    cssVar: "var(--font-noto-serif-kr)",
  },
  {
    value: "nanum-gothic",
    label: "Nanum Gothic",
    cssVar: "var(--font-nanum-gothic)",
  },
] as const;

export const FONT_UI_OPTIONS = [
  { value: "inter", label: "Inter", cssVar: "var(--font-inter)" },
  { value: "pt-serif", label: "PT Serif", cssVar: "var(--font-pt-serif)" },
  { value: "comfortaa", label: "Comfortaa", cssVar: "var(--font-comfortaa)" },
] as const;

export type FontKrValue = (typeof FONT_KR_OPTIONS)[number]["value"];
export type FontUiValue = (typeof FONT_UI_OPTIONS)[number]["value"];

export function fontKrCssVar(value: string | null): string | undefined {
  return FONT_KR_OPTIONS.find((o) => o.value === value)?.cssVar;
}
export function fontUiCssVar(value: string | null): string | undefined {
  return FONT_UI_OPTIONS.find((o) => o.value === value)?.cssVar;
}
