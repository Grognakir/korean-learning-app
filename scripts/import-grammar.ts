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

type Example = { kr: string; ru: string };

type SourcePoint = {
  external_id: string;
  pattern: string;
  short_desc: string | null;
  category: string;
  grammar_group: string | null;
  lesson_label: string | null;
  lessons: number[];
  explanation: string | null;
  usage: string[];
  rules: string[];
  examples: Example[];
  vocab: Example[] | null;
};
type SourceFile = { points: SourcePoint[] };

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Использование: tsx scripts/import-grammar.ts <path-to-grammar.json>");
  }
  const source: SourceFile = JSON.parse(
    readFileSync(join(process.cwd(), filePath), "utf-8"),
  );

  console.log(`Конструкций: ${source.points.length}`);

  const { error } = await supabase.from("grammar_points").upsert(
    source.points.map((p) => ({
      external_id: p.external_id,
      pattern: p.pattern,
      short_desc: p.short_desc,
      category: p.category,
      grammar_group: p.grammar_group,
      lesson_label: p.lesson_label,
      lessons: p.lessons,
      explanation: p.explanation,
      usage: p.usage,
      rules: p.rules,
      examples: p.examples,
      vocab: p.vocab,
    })),
    { onConflict: "external_id" },
  );
  if (error) throw error;

  console.log(`Готово: ${source.points.length} конструкций импортировано.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
