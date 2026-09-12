import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { areaKey, areaLabel } from "./areas";
import type { GrammarArea, GrammarExercises, TrainerGrammar } from "./types";

type Client = Awaited<ReturnType<typeof createClient>>;

type GrammarRow = {
  id: string;
  pattern: string;
  short_desc: string | null;
  category: string;
  explanation: string | null;
  rules: string[] | null;
  usage: string[] | null;
  examples: { kr: string; ru: string }[] | null;
  grammar_exercises: GrammarExercises | GrammarExercises[] | null;
};

export type GrammarAreaWithCategory = GrammarArea & { category: string };

// Области, в которых есть грамматики с упражнениями, по порядку номеров.
export async function loadGrammarAreas(supabase: Client): Promise<GrammarAreaWithCategory[]> {
  const { data, error } = await supabase
    .from("grammar_points")
    .select("category, grammar_exercises!inner(grammar_point_id)");
  if (error) throw new Error("Не удалось загрузить грамматику");

  const areas = new Map<string, GrammarAreaWithCategory>();
  for (const { category } of (data ?? []) as { category: string }[]) {
    const area = areas.get(category) ?? { key: areaKey(category), label: areaLabel(category), category, count: 0 };
    area.count++;
    areas.set(category, area);
  }
  return [...areas.values()].sort((a, b) =>
    Number(a.key) - Number(b.key) || a.label.localeCompare(b.label, "ru"),
  );
}

export async function loadTrainerGrammars(supabase: Client, categories: string[]): Promise<TrainerGrammar[]> {
  if (!categories.length) return [];
  const { data, error } = await supabase
    .from("grammar_points")
    .select("id, pattern, short_desc, category, explanation, rules, usage, examples, grammar_exercises!inner(drills, match, cloze, reply, blitz)")
    .in("category", categories);
  if (error) throw new Error("Не удалось загрузить упражнения");

  return ((data ?? []) as GrammarRow[]).flatMap((row) => {
    const exercises = Array.isArray(row.grammar_exercises) ? row.grammar_exercises[0] : row.grammar_exercises;
    if (!exercises) return [];
    return [{
      id: row.id,
      pattern: row.pattern,
      meaning: row.short_desc,
      category: row.category,
      explanation: row.explanation,
      rules: row.rules ?? [],
      usage: row.usage ?? [],
      examples: row.examples ?? [],
      drills: exercises.drills,
      match: exercises.match,
      cloze: exercises.cloze,
      reply: exercises.reply,
      blitz: exercises.blitz,
    }];
  });
}
