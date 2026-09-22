// Темы — рукописный кураторский контент (как тренажёры/режимы обучения),
// не строчки из БД: список пополняется руками по мере авторства новых тем.
export type TopicListItem = {
  slug: string;
  title: string;
  subtitle: string;
};

export const TOPICS_LIST: TopicListItem[] = [
  {
    slug: "questions",
    title: "Вопросы",
    subtitle: "의문사 — как строить вопросы по-корейски",
  },
];
