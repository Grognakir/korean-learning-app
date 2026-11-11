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

type SourceWord = {
  external_id: string;
  headword: string;
  reading: string | null;
  part_of_speech: string | null;
  level_tag: string | null;
  categories: string[];
  translations: string[];
  examples: { kr: string; ru: string }[];
  notes: string[];
  forms: { label: string; value: string }[];
  related: { label: string; value: string }[];
};
type SourceFile = { categories: string[]; words: SourceWord[] };

// Удаляет строки слова с external_id вида `<префикс>N`, которых нет в новом
// наборе: иначе после сокращения числа значений/примеров/примечаний в
// базе остаются старые строки. Строки без external_id (добавленные
// пользователем вручную) не трогаем — они не подходят под like.
async function pruneStale(
  table: "translations" | "word_examples" | "word_notes" | "word_forms",
  wordId: string,
  prefix: string,
  keep: string[],
) {
  let request = supabase
    .from(table)
    .delete()
    .eq("word_id", wordId)
    .like("external_id", `${prefix}%`);
  if (keep.length > 0) {
    request = request.not(
      "external_id",
      "in",
      `(${keep.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(",")})`,
    );
  }
  const { error } = await request;
  if (error) throw error;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Использование: tsx scripts/import-dictionary.ts <path-to-words.json> [--only=слово1,слово2]");
  }
  const source: SourceFile = JSON.parse(
    readFileSync(join(process.cwd(), filePath), "utf-8"),
  );

  // --only=<headword1,headword2> — импортировать не весь файл (тысячи
  // последовательных upsert'ов, ощутимо на production), а только явно
  // перечисленные слова. Обычный случай — добавили в словарь пару новых
  // слов ради теста словарного покрытия и хотим синхронизировать только их.
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  let words = source.words;
  if (onlyArg) {
    const requested = onlyArg
      .slice("--only=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const known = new Set(source.words.map((w) => w.headword));
    const notFound = requested.filter((h) => !known.has(h));
    if (notFound.length > 0) {
      throw new Error(
        `--only: не найдены в ${filePath}: ${notFound.join(", ")} (опечатка? слово ещё не добавлено в файл?)`,
      );
    }
    const wanted = new Set(requested);
    words = source.words.filter((w) => wanted.has(w.headword));
  }

  console.log(
    `Категорий: ${source.categories.length}, слов: ${words.length}${onlyArg ? ` (из ${source.words.length} в файле)` : ""}`,
  );

  // Глобальные категории уникальны по lower(name) частичным
  // индексом (owner_user_id is null) — такую уникальность PostgREST не
  // умеет указать в on_conflict, поэтому вставляем только недостающие.
  const { data: existingCategories, error: existingError } = await supabase
    .from("categories")
    .select("id, name")
    .is("owner_user_id", null);
  if (existingError) throw existingError;

  const categoryIdByLowerName = new Map(
    (existingCategories ?? []).map((c) => [c.name.toLowerCase(), c.id]),
  );

  const missing = source.categories.filter(
    (name) => !categoryIdByLowerName.has(name.toLowerCase()),
  );
  if (missing.length > 0) {
    const { data: created, error: createError } = await supabase
      .from("categories")
      .insert(missing.map((name) => ({ name, owner_user_id: null })))
      .select();
    if (createError) throw createError;
    for (const c of created ?? []) {
      categoryIdByLowerName.set(c.name.toLowerCase(), c.id);
    }
  }

  const categoryIdByName = new Map(
    source.categories.map((name) => [
      name,
      categoryIdByLowerName.get(name.toLowerCase())!,
    ]),
  );

  for (const word of words) {
    const { data: wordRow, error: wordError } = await supabase
      .from("words")
      .upsert(
        {
          external_id: word.external_id,
          headword: word.headword,
          reading: word.reading,
          part_of_speech: word.part_of_speech,
          level_tag: word.level_tag,
        },
        { onConflict: "external_id" },
      )
      .select()
      .single();
    if (wordError) throw wordError;

    const categoryLinks = word.categories.map((name) => ({
      word_id: wordRow.id,
      category_id: categoryIdByName.get(name),
    }));
    const { error: linkError } = await supabase
      .from("word_categories")
      .upsert(categoryLinks, { onConflict: "word_id,category_id" });
    if (linkError) throw linkError;

    if (word.translations.length > 0) {
      const { error } = await supabase.from("translations").upsert(
        word.translations.map((text, i) => ({
          word_id: wordRow.id,
          external_id: `${word.external_id}-tr-${i}`,
          text,
        })),
        { onConflict: "external_id" },
      );
      if (error) throw error;
    }
    await pruneStale(
      "translations",
      wordRow.id,
      `${word.external_id}-tr-`,
      word.translations.map((_, i) => `${word.external_id}-tr-${i}`),
    );

    if (word.examples.length > 0) {
      const { error } = await supabase.from("word_examples").upsert(
        word.examples.map((ex, i) => ({
          word_id: wordRow.id,
          external_id: `${word.external_id}-ex-${i}`,
          kr: ex.kr,
          ru: ex.ru,
        })),
        { onConflict: "external_id" },
      );
      if (error) throw error;
    }
    await pruneStale(
      "word_examples",
      wordRow.id,
      `${word.external_id}-ex-`,
      word.examples.map((_, i) => `${word.external_id}-ex-${i}`),
    );

    if (word.notes.length > 0) {
      const { error } = await supabase.from("word_notes").upsert(
        word.notes.map((text, i) => ({
          word_id: wordRow.id,
          external_id: `${word.external_id}-note-${i}`,
          text,
        })),
        { onConflict: "external_id" },
      );
      if (error) throw error;
    }
    await pruneStale(
      "word_notes",
      wordRow.id,
      `${word.external_id}-note-`,
      word.notes.map((_, i) => `${word.external_id}-note-${i}`),
    );

    // related (антонимы/синонимы) хранится в той же таблице, что и формы
    // словоизменения (общая гибкая структура label/value), но это не
    // грамматическая форма — UI различает их по label ("антоним"/"синоним")
    // и рендерит отдельным выделенным блоком, не в общем списке "Формы".
    const forms = [
      ...word.forms.map((f) => ({ label: f.label, value: f.value })),
      ...word.related.map((r) => ({ label: r.label, value: r.value })),
    ];
    if (forms.length > 0) {
      const { error } = await supabase.from("word_forms").upsert(
        forms.map((f, i) => ({
          word_id: wordRow.id,
          external_id: `${word.external_id}-form-${i}`,
          label: f.label,
          value: f.value,
        })),
        { onConflict: "external_id" },
      );
      if (error) throw error;
    }
    await pruneStale(
      "word_forms",
      wordRow.id,
      `${word.external_id}-form-`,
      forms.map((_, i) => `${word.external_id}-form-${i}`),
    );
  }

  console.log(`Готово: ${words.length} слов импортировано.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
