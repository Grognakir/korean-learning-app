export type LevelKind = "match" | "mcq-word" | "type" | "mcq-phrase";

export type Level = {
  id: number;
  title: string;
  description: string;
  kind: LevelKind;
  direction?: "kr2ru" | "ru2kr";
};

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "Сопоставление",
    description: "Даны вопросительные слова на корейском и варианты их перевода.",
    kind: "match",
  },
  {
    id: 2,
    title: "Узнавание: слово → перевод",
    description: "Дано корейское слово, выбери перевод из 4 вариантов.",
    kind: "mcq-word",
    direction: "kr2ru",
  },
  {
    id: 3,
    title: "Письмо",
    description: "Дан перевод, напиши слово на корейском.",
    kind: "type",
  },
  {
    id: 4,
    title: "Узнавание: перевод → слово",
    description: "Дан перевод, выбери корейское слово из 4 вариантов.",
    kind: "mcq-word",
    direction: "ru2kr",
  },
  {
    id: 5,
    title: "Живые вопросы",
    description: "Целые фразы из повседневной речи — нужно выбрать верный перевод.",
    kind: "mcq-phrase",
  },
];
