import type { TopicQuizQuestion } from "./types";

export function shuffleOptions(questions: TopicQuizQuestion[]): TopicQuizQuestion[] {
  return questions.map((question) => {
    const options = [...question.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { ...question, options };
  });
}
