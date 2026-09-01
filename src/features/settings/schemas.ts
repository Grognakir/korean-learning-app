import { z } from "zod";
import { FONT_KR_OPTIONS, FONT_UI_OPTIONS } from "./fontOptions";

const fontKrValues = FONT_KR_OPTIONS.map((o) => o.value) as [string, ...string[]];
const fontUiValues = FONT_UI_OPTIONS.map((o) => o.value) as [string, ...string[]];

export const fontPreferencesSchema = z.object({
  fontUi: z.enum(fontUiValues).nullable(),
  fontKr: z.enum(fontKrValues).nullable(),
});

export const activeLanguageSchema = z.object({
  language: z.enum(["ko", "en"]),
});
