import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Отдельный клиент, не lib/supabase/admin.ts — тот файл помечен
// "server-only" и рассчитан на выполнение внутри Next.js (react-server
// условие резолва пакета), а не в самостоятельном tsx-скрипте.
process.loadEnvFile(join(process.cwd(), ".env.local"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Hint = { kr: string; ru: string };

type SourceQuestion = {
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
type SourceFile = { questions: SourceQuestion[] };

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Использование: tsx scripts/import-topic-quiz.ts <path-to-topic-quiz.json>");
  }
  const source: SourceFile = JSON.parse(
    readFileSync(join(process.cwd(), filePath), "utf-8"),
  );

  console.log(`Вопросов: ${source.questions.length}`);

  const { error } = await supabase.from("topic_quiz_questions").upsert(
    source.questions.map((q) => ({
      external_id: q.external_id,
      topic: q.topic,
      before_text: q.before_text,
      after_text: q.after_text,
      question_text: q.question_text,
      options: q.options,
      correct: q.correct,
      translation_ru: q.translation_ru,
      hint: q.hint,
    })),
    { onConflict: "external_id" },
  );
  if (error) throw error;

  console.log(`Готово: ${source.questions.length} вопросов импортировано.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
