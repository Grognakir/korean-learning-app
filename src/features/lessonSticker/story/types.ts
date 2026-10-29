import type { Situation } from "../clothing/situations";

export type Speaker = "jia" | "clerk";

/** remote — разговор на расстоянии (звонок, онлайн-магазин): персонаж
 * зелёной голограммой; live — встреча вживую, персонаж в цвете. */
export type Presence = "remote" | "live";

export type StoryStep =
  | { type: "incoming"; caller: string; avatar: string }
  | { type: "system"; lines: string[] }
  | {
      type: "line";
      who: Speaker;
      pose: string;
      text: string;
      lang: "ko" | "ru";
      /** Перевод корейской реплики. */
      ru?: string;
    }
  | { type: "reply"; options: { text: string; ru?: string }[] }
  | { type: "shop" }
  | { type: "verdict" };

export type Episode = {
  id: string;
  title: string;
  /** Все шаги эпизода; персонажи на расстоянии (remote), кроме шага verdict. */
  steps: StoryStep[];
  assortment: string[];
  rules: Situation;
  /** Что 지아 велела купить — для упрёка при провале. */
  advice: string;
  adviceRu: string;
  background?: string;
};

export const SPEAKERS: Record<Speaker, { name: string; base: string }> = {
  jia: { name: "지아", base: "/images/dialogue/jia" },
  clerk: { name: "점원", base: "/images/dialogue/clerk" },
};

export function poseSrc(who: Speaker, pose: string): string {
  return `${SPEAKERS[who].base}/${pose}.webp`;
}
