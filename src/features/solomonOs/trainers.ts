import type { OutfitPiece } from "../lessonSticker/clothing/situations";
import { EPISODES } from "../lessonSticker/story/episodeList";
import { pickEpisode } from "../lessonSticker/story/InterviewGame";
import type { Episode } from "../lessonSticker/story/types";
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

/** Шаги встречи: после магазина — место и время, затем вердикт. */
export function meetingRange(episode: Episode): { from: number; to: number } {
  return {
    from: episode.steps.findIndex((s) => s.type === "shop") + 1,
    to: episode.steps.length - 1,
  };
}
