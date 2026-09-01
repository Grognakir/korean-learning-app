import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_PATH = "../korean_flashcards/data/theme.json";
const OUTPUT_PATH = "content/trainers/topic-quiz.json";

// Только темы с готовыми данными сейчас — см. план: остальные из списка
// пользователя пока "скоро" в UI, без контента.
const TOPICS = ["irregular", "position", "datetime", "counters", "honorific"] as const;

type Hint = { kr: string; ru: string };

type SourceQuestion = {
  id: string;
  before?: string;
  after?: string;
  question?: string;
  options: string[];
  correct: string;
  ru: string;
  hint?: Hint[];
};

type SourceFile = Record<string, SourceQuestion[]>;

type OutputQuestion = {
  external_id: string;
  topic: string;
  before_text: string | null;
  after_text: string | null;
  question_text: string | null;
  options: string[];
  correct: string;
  translation_ru: string | null;
  hint: Hint[] | null;
};

function main() {
  const source: SourceFile = JSON.parse(
    readFileSync(join(process.cwd(), SOURCE_PATH), "utf-8"),
  );

  const questions: OutputQuestion[] = [];
  for (const topic of TOPICS) {
    for (const q of source[topic] ?? []) {
      questions.push({
        external_id: `topic-quiz-${topic}-${q.id}`,
        topic,
        before_text: q.before ?? null,
        after_text: q.after ?? null,
        question_text: q.question ?? null,
        options: q.options,
        correct: q.correct,
        translation_ru: q.ru?.trim() ? q.ru.trim() : null,
        hint: q.hint && q.hint.length > 0 ? q.hint : null,
      });
    }
  }

  writeFileSync(
    join(process.cwd(), OUTPUT_PATH),
    JSON.stringify({ questions }, null, 2) + "\n",
    "utf-8",
  );

  const perTopic = TOPICS.map((t) => `${t}: ${source[t]?.length ?? 0}`).join(", ");
  console.log(`Вопросов: ${questions.length} (${perTopic}) → ${OUTPUT_PATH}`);
}

main();
