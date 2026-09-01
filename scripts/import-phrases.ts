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

type SourcePhrase = {
  external_id: string;
  phrase_kr: string;
  reading: string;
  translation: string;
  usage_note: string | null;
  category: string;
};
type SourceFile = { phrases: SourcePhrase[] };

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Использование: tsx scripts/import-phrases.ts <path-to-phrases.json>");
  }
  const source: SourceFile = JSON.parse(
    readFileSync(join(process.cwd(), filePath), "utf-8"),
  );

  console.log(`Фраз: ${source.phrases.length}`);

  const { error } = await supabase.from("phrases").upsert(
    source.phrases.map((p) => ({
      external_id: p.external_id,
      phrase_kr: p.phrase_kr,
      reading: p.reading,
      translation: p.translation,
      usage_note: p.usage_note,
      category: p.category,
    })),
    { onConflict: "external_id" },
  );
  if (error) throw error;

  console.log(`Готово: ${source.phrases.length} фраз импортировано.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
