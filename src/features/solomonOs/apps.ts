import type { IconName } from "./icons";

export type AppId =
  | "msg"
  | "call"
  | "shop"
  | "notes"
  | "term"
  | "set"
  | "map"
  | "bank"
  | "cal"
  | "photo";

export type OsApp = {
  id: AppId;
  ko: string;
  ru: string;
  icon: IconName;
  /** Размер окна по умолчанию на компьютере. */
  w: number;
  h: number;
  /** Окно не уже и не ниже этого (по умолчанию 300×220): магазину нужно
   * место под сцену, примерочную и окно диалога. */
  minW?: number;
  minH?: number;
  /** Под замком — откроется по сюжету. */
  locked?: boolean;
};

export const APPS: OsApp[] = [
  { id: "msg", ko: "메시지", ru: "Сообщения", icon: "msg", w: 760, h: 520 },
  { id: "call", ko: "전화", ru: "Телефон", icon: "call", w: 860, h: 680 },
  {
    id: "shop",
    ko: "쇼핑",
    ru: "Магазин",
    icon: "shop",
    w: 1000,
    h: 700,
    minW: 480,
    minH: 560,
  },
  { id: "notes", ko: "메모", ru: "Заметки", icon: "notes", w: 800, h: 590 },
  { id: "term", ko: "터미널", ru: "Терминал", icon: "term", w: 600, h: 380 },
  { id: "set", ko: "설정", ru: "Настройки", icon: "set", w: 440, h: 320 },
  {
    id: "map",
    ko: "지도",
    ru: "Карта",
    icon: "map",
    w: 1180,
    h: 840,
  },
  {
    id: "bank",
    ko: "은행",
    ru: "Банк",
    icon: "bank",
    w: 460,
    h: 320,
    locked: true,
  },
  {
    id: "cal",
    ko: "달력",
    ru: "Календарь",
    icon: "cal",
    w: 900,
    h: 640,
    minW: 360,
    minH: 420,
  },
  {
    id: "photo",
    ko: "사진",
    ru: "Фото",
    icon: "photo",
    w: 460,
    h: 320,
    locked: true,
  },
];

export const APP_BY_ID = Object.fromEntries(
  APPS.map((a) => [a.id, a]),
) as Record<AppId, OsApp>;

/** Аватар 지아 (голограммой через CSS-фильтр). */
export const JIA_AVATAR = "/images/lesson-sticker/jia-call/idle.png";
