import type { OutfitPiece } from "../lessonSticker/clothing/situations";
import { EPISODES } from "../lessonSticker/story/episodeList";
import { pickEpisode } from "../lessonSticker/story/InterviewGame";
import type { Episode, StoryStep } from "../lessonSticker/story/types";
import { JIA_AVATAR } from "./apps";

/** Тренажёр в расписании ОС: кто звонит и какую ситуацию играть.
 * Новый тренажёр подключается одной записью в SCHEDULED_TRAINERS. */
export type OsTrainer = {
  id: string;
  caller: string;
  avatar: string;
  /** Ключ прогресса, как у стикера урока (lessonSticker/progress.ts). */
  progressKey: string;
  /** Ситуация для звонка; last — прошлая, чтобы не повторяться. */
  pickEpisode: (last: string | null) => Episode;
};

export const SCHEDULED_TRAINERS: OsTrainer[] = [
  {
    id: "lesson10-clothes",
    caller: "지아",
    avatar: JIA_AVATAR,
    progressKey: "interview",
    pickEpisode: (last) => pickEpisode(last),
  },
];

export const trainerById = (id: string) =>
  SCHEDULED_TRAINERS.find((t) => t.id === id);
export const episodeById = (id: string) => EPISODES.find((e) => e.id === id);

/** Задание после звонка: купить одежду. Корзина переживает закрытие окна. */
export type OsTask = {
  id?: string;
  assignedAt?: number;
  trainerId: string;
  episodeId: string;
  cart: OutfitPiece[];
};

/** Шаги звонка: от первой реплики (без экрана входящего) до «CALL ENDED». */
export function callRange(episode: Episode): { from: number; to: number } {
  const end = episode.steps.findIndex(
    (s) => s.type === "system" && s.lines[0] === "CALL ENDED",
  );
  return {
    from: 1,
    to: end >= 0 ? end : episode.steps.findIndex((s) => s.type === "shop") - 1,
  };
}

/** Просьба 지아: подряд идущие корейские реплики перед последним ответом
 * игрока в звонке (что купить, какого цвета, чего нельзя). */
export function requestLines(episode: Episode): { ko: string; ru?: string }[] {
  const end = episode.steps.findIndex(
    (s) => s.type === "system" && s.lines[0] === "CALL ENDED",
  );
  let i = episode.steps
    .slice(0, end < 0 ? undefined : end)
    .map((s) => s.type)
    .lastIndexOf("reply");
  const lines: { ko: string; ru?: string }[] = [];
  for (
    let s = episode.steps[--i];
    s?.type === "line" && s.who === "jia" && s.lang === "ko";
    s = episode.steps[--i]
  )
    lines.unshift({ ko: s.text, ru: s.ru });
  return lines;
}

/** Повторный звонок, когда задание уже дано: 지아 помнит разговор — ворчит,
 * что игрок опять забыл, и повторяет просьбу. Тот же id эпизода: задание и
 * корзина остаются. */
export function reminderEpisode(episode: Episode): Episode {
  const steps: StoryStep[] = [
    episode.steps[0],
    {
      type: "line",
      who: "jia",
      pose: "call-talk",
      lang: "ko",
      text: "여보세요? 또 전화했네요. 무슨 일이에요?",
      ru: "Алло? Снова звонишь. Что случилось?",
    },
    {
      type: "reply",
      options: [
        {
          text: "미안해요, 뭘 사야 하는지 잊어버렸어요.",
          ru: "Прости, забыл, что надо купить.",
        },
      ],
    },
    {
      type: "line",
      who: "jia",
      pose: "call-annoyed",
      lang: "ko",
      text: "또 잊어버렸어요? 정말! 다시 말할게요.",
      ru: "Опять забыл? Ну правда! Повторю.",
    },
    ...requestLines(episode).map((l): StoryStep => ({
      type: "line",
      who: "jia",
      pose: "call-talk",
      lang: "ko",
      text: l.ko,
      ru: l.ru,
    })),
    {
      type: "line",
      who: "jia",
      pose: "call-smirk",
      lang: "ko",
      text: "이번에는 잊지 마세요!",
      ru: "В этот раз не забудь!",
    },
    { type: "reply", options: [{ text: "네, 알겠어요.", ru: "Да, понял." }] },
    { type: "system", lines: ["CALL ENDED"] },
  ];
  return { ...episode, steps };
}

/** Шаги встречи: после магазина — место и время, затем вердикт. */
export function meetingRange(episode: Episode): { from: number; to: number } {
  return {
    from: episode.steps.findIndex((s) => s.type === "shop") + 1,
    to: episode.steps.length - 1,
  };
}
