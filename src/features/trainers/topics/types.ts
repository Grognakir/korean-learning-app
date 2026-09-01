export const TOPICS = [
  { key: "irregular", label: "Неправильные глаголы" },
  { key: "position", label: "Местоположение" },
  { key: "datetime", label: "Время и даты" },
  { key: "counters", label: "Счётные слова" },
  { key: "route", label: "Маршрут" },
  { key: "honorific", label: "Уважение" },
  { key: "illness", label: "Болезнь" },
  { key: "food", label: "Еда и готовка" },
  { key: "habits", label: "Полезные привычки" },
  { key: "phone", label: "Переписка и звонок" },
  { key: "shop", label: "Ресторан и магазин" },
  { key: "rules", label: "Правила поведения" },
  { key: "schedule", label: "Расписание" },
] as const;

export type TopicKey = (typeof TOPICS)[number]["key"];

export const VALID_TOPICS: TopicKey[] = TOPICS.map((t) => t.key);

export type TopicQuizQuestion = {
  id: string;
  topic: string;
  before_text: string | null;
  after_text: string | null;
  question_text: string | null;
  options: string[];
  correct: string;
  translation_ru: string | null;
  hint: { kr: string; ru: string }[] | null;
};
