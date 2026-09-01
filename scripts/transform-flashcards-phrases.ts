import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Источник — тот же соседний репозиторий, что и для words.json.
const SOURCE_PATH = "../korean_flashcards/data/phrases.json";
const OUTPUT_PATH = "content/dictionary/phrases.json";

type SourceCategory = {
  category: string;
  phrases: { kr: string; translit: string; meaning: string; notes: string }[];
};

type OutputPhrase = {
  external_id: string;
  phrase_kr: string;
  reading: string;
  translation: string;
  usage_note: string | null;
  category: string;
};

function main() {
  const source: SourceCategory[] = JSON.parse(
    readFileSync(join(process.cwd(), SOURCE_PATH), "utf-8"),
  );

  // Дедуп external_id по kr-тексту — тот же паттерн, что в
  // transform-flashcards-dictionary.ts: если один и тот же корейский
  // текст встречается несколько раз, различаем "-2", "-3" и т.д.
  const krCount = new Map<string, number>();

  const phrases: OutputPhrase[] = source.flatMap((cat) =>
    cat.phrases.map((p) => {
      const seen = (krCount.get(p.kr) ?? 0) + 1;
      krCount.set(p.kr, seen);
      const externalId = seen > 1 ? `phrase-${p.kr}-${seen}` : `phrase-${p.kr}`;

      return {
        external_id: externalId,
        phrase_kr: p.kr,
        reading: p.translit,
        translation: p.meaning,
        usage_note: p.notes.trim() ? p.notes.trim() : null,
        category: cat.category,
      };
    }),
  );

  writeFileSync(
    join(process.cwd(), OUTPUT_PATH),
    JSON.stringify({ phrases }, null, 2) + "\n",
    "utf-8",
  );

  console.log(`Категорий: ${source.length}, фраз: ${phrases.length} → ${OUTPUT_PATH}`);
}

main();
