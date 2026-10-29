import { ITEMS } from "../clothing/items";
import type { Situation, TargetId } from "../clothing/situations";
import type { Episode, StoryStep } from "./types";

type Say = { pose: string; text: string; ru: string };

export type EpisodeSpec = {
  id: string;
  title: string;
  kind: Episode["kind"];
  /** Первая реплика 지아 по-русски. */
  hello: string;
  /** Корейские реплики 지아: повод, что купить, чего нельзя. */
  call: Say[];
  /** Ответ игрока в конце разговора. */
  agree: { text: string; ru: string };
  placeKo: string;
  placeRu: string;
  /** Системные строки перед встречей: время и место. */
  place: string[];
  advice: string;
  adviceRu: string;
  praise: Episode["praise"];
  rules: Omit<Situation, "id" | "target" | "kind" | "ko" | "ru" | "success">;
  background?: string;
};

/** Все вещи магазина: манекены сами раскладывают их по зонам. */
export const ALL_ITEMS = ITEMS.map((it) => it.id);

const HELLO_REPLIES: Record<Episode["kind"], { text: string }[]> = {
  self: [{ text: "Привет! Что случилось?" }, { text: "Да, слушаю." }],
  forJia: [{ text: "Конечно, что нужно?" }, { text: "Смотря о чём…" }],
};

const BYE: Record<Episode["kind"], Say> = {
  self: { pose: "call-talk", text: "좋아요. 화이팅!", ru: "Отлично. Удачи!" },
  forJia: { pose: "call-smirk", text: "정말 고마워요! 이따 봐요!", ru: "Спасибо огромное! До встречи!" },
};

/** Эпизод из короткого описания: звонок 지아 → онлайн-магазин → встреча. */
export function makeEpisode(spec: EpisodeSpec): Episode {
  const target: TargetId = spec.kind === "forJia" ? "jia" : "player";
  const steps: StoryStep[] = [
    { type: "incoming", caller: "지아", avatar: "/images/lesson-sticker/jia-call/idle.png" },
    { type: "line", who: "jia", pose: "call-talk", lang: "ru", text: spec.hello },
    { type: "reply", options: HELLO_REPLIES[spec.kind] },
    {
      type: "line",
      who: "jia",
      pose: "call-smirk",
      lang: "ru",
      text: "Только давай по-корейски — заодно потренируешься.",
    },
    ...spec.call.map((s): StoryStep => ({ type: "line", who: "jia", lang: "ko", ...s })),
    { type: "reply", options: [spec.agree] },
    { type: "line", who: "jia", lang: "ko", ...BYE[spec.kind] },
    { type: "system", lines: ["CALL ENDED", "ONLINE STORE", "CONNECTING..."] },
    {
      type: "line",
      who: "clerk",
      pose: "welcome",
      lang: "ko",
      text: "어서 오세요! 천천히 구경하세요.",
      ru: "Добро пожаловать! Осматривайтесь не спеша.",
    },
    { type: "shop" },
    { type: "system", lines: spec.place },
    { type: "verdict" },
  ];

  return {
    id: spec.id,
    title: spec.title,
    kind: spec.kind,
    placeKo: spec.placeKo,
    placeRu: spec.placeRu,
    praise: spec.praise,
    advice: spec.advice,
    adviceRu: spec.adviceRu,
    background: spec.background,
    assortment: ALL_ITEMS,
    steps,
    // Покупка по списку 지아: полный наряд не требуется, только её правила.
    rules: { id: `story-${spec.id}`, target, kind: "shopping", ko: "", ru: "", success: "", ...spec.rules },
  };
}
