import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@/features/learning/types";

/** Какие конструкции из блоков есть в словаре (по совпадению pattern) —
 * для кнопки «Изучить подробнее» в блоке грамматики урока. */
export async function loadDictionaryPatterns(
  supabase: SupabaseClient,
  blocks: Block[],
): Promise<string[]> {
  const patterns = [
    ...new Set(
      blocks.flatMap((block) => (block.type === "grammar_point" ? [block.pattern] : [])),
    ),
  ];
  if (patterns.length === 0) return [];
  const { data } = await supabase
    .from("grammar_points")
    .select("pattern")
    .in("pattern", patterns)
    .is("owner_user_id", null);
  return (data ?? []).map((row) => row.pattern as string);
}
