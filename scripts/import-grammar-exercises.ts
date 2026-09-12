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

type SourceExercise = {
  grammar_external_id: string;
  drills: unknown[];
  match: unknown[];
  cloze: unknown[];
  reply: unknown[];
  blitz: unknown[];
};
type SourceFile = { exercises: SourceExercise[] };

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Использование: tsx scripts/import-grammar-exercises.ts <path-to-grammar-exercises.json>");
  }
  const source: SourceFile = JSON.parse(
    readFileSync(join(process.cwd(), filePath), "utf-8"),
  );
  const externalIds = source.exercises.map((e) => e.grammar_external_id);

  console.log(`Грамматик с упражнениями: ${externalIds.length}`);

  const { data: points, error: pointsError } = await supabase
    .from("grammar_points")
    .select("id, external_id")
    .in("external_id", externalIds);
  if (pointsError) throw pointsError;

  const idByExternal = new Map((points ?? []).map((p) => [p.external_id as string, p.id as string]));
  const missing = externalIds.filter((id) => !idByExternal.has(id));
  if (missing.length) {
    throw new Error(`Нет в grammar_points (сначала import:grammar): ${missing.join(", ")}`);
  }

  const { error } = await supabase.from("grammar_exercises").upsert(
    source.exercises.map((e) => ({
      grammar_point_id: idByExternal.get(e.grammar_external_id),
      drills: e.drills,
      match: e.match,
      cloze: e.cloze,
      reply: e.reply,
      blitz: e.blitz,
    })),
    { onConflict: "grammar_point_id" },
  );
  if (error) throw error;

  console.log(`Готово: упражнения для ${externalIds.length} грамматик импортированы.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
