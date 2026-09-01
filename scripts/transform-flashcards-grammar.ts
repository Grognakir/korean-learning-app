import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_PATH = "../korean_flashcards/data/grammar.json";
const OUTPUT_PATH = "content/dictionary/grammar.json";

type Example = { kr: string; ru: string };

type SourceItem = {
  pattern: string;
  desc: string;
  lesson: string;
  group: string | null;
  explanation: string;
  lessons: number[];
  usage: string[];
  rules: string[];
  examples: Example[];
  vocab?: Example[];
};

type SourceCategory = {
  category: string;
  items: SourceItem[];
};

type OutputPoint = {
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

function main() {
  const source: SourceCategory[] = JSON.parse(
    readFileSync(join(process.cwd(), SOURCE_PATH), "utf-8"),
  );

  // 4 паттерна текстом повторяются в разных категориях (см. план) —
  // осознанно разные записи, не дубли; дедуп по тому же groupIndex-паттерну,
  // что в transform-flashcards-dictionary.ts/transform-flashcards-phrases.ts.
  const patternCount = new Map<string, number>();
  const points: OutputPoint[] = [];

  for (const cat of source) {
    for (const item of cat.items) {
      const seen = (patternCount.get(item.pattern) ?? 0) + 1;
      patternCount.set(item.pattern, seen);
      const externalId =
        seen > 1 ? `grammar-${item.pattern}-${seen}` : `grammar-${item.pattern}`;

      points.push({
        external_id: externalId,
        pattern: item.pattern,
        short_desc: item.desc?.trim() ? item.desc.trim() : null,
        category: cat.category,
        grammar_group: item.group?.trim() ? item.group.trim() : null,
        lesson_label: item.lesson?.trim() ? item.lesson.trim() : null,
        lessons: item.lessons ?? [],
        explanation: item.explanation?.trim() ? item.explanation.trim() : null,
        usage: item.usage ?? [],
        rules: item.rules ?? [],
        examples: item.examples ?? [],
        vocab: item.vocab && item.vocab.length > 0 ? item.vocab : null,
      });
    }
  }

  writeFileSync(
    join(process.cwd(), OUTPUT_PATH),
    JSON.stringify({ points }, null, 2) + "\n",
    "utf-8",
  );

  console.log(
    `Категорий: ${source.length}, конструкций: ${points.length} → ${OUTPUT_PATH}`,
  );
}

main();
