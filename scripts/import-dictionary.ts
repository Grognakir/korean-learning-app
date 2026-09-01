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
type SourceFile = { language?: "ko" | "en"; categories: string[]; words: SourceWord[] };

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Использование: tsx scripts/import-dictionary.ts <path-to-words.json>");
  }
  const source: SourceFile = JSON.parse(
    readFileSync(join(process.cwd(), filePath), "utf-8"),
  );

  const language = source.language ?? "ko";
  console.log(
    `Язык: ${language}, категорий: ${source.categories.length}, слов: ${source.words.length}`,
  );

  // Глобальные категории уникальны по (language, lower(name)) частичным
  // индексом (owner_user_id is null) — такую уникальность PostgREST не
  // умеет указать в on_conflict, поэтому вставляем только недостающие.
  const { data: existingCategories, error: existingError } = await supabase
    .from("categories")
    .select("id, name")
    .is("owner_user_id", null)
    .eq("language", language);
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
      .insert(missing.map((name) => ({ name, owner_user_id: null, language })))
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

  for (const word of source.words) {
    const { data: wordRow, error: wordError } = await supabase
      .from("words")
      .upsert(
        {
          external_id: word.external_id,
          headword: word.headword,
          reading: word.reading,
          part_of_speech: word.part_of_speech,
          level_tag: word.level_tag,
          language,
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
  }

  console.log(`Готово: ${source.words.length} слов импортировано.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
