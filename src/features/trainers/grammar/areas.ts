export const MIN_GRAMMARS = 5;
export const MAX_GRAMMARS = 20;
export const BLITZ_SECONDS = [1, 2, 3, 4, 5] as const;
export const DEFAULT_BLITZ_SECONDS = 3;
export const BLITZ_PER_GRAMMAR = 4;

// Категории в grammar_points пронумерованы («3. Время и вид глагола»):
// номер — короткий ключ для URL, остальное — подпись без уточнений.
export function areaKey(category: string): string {
  return category.match(/^(\d+)\./)?.[1] ?? category;
}

export function areaLabel(category: string): string {
  return category.replace(/^\d+\.\s*/, "").split(" — ")[0].split(" (")[0].trim();
}

/* Количество грамматик зависит от области:
   — в выбранных областях больше 20 → ползунок 5…20;
   — от 6 до 20 → ползунок 5…доступно;
   — 5 и меньше → выбирать нечего, в сессию идут все. */
export function countRange(available: number) {
  const max = Math.min(MAX_GRAMMARS, available);
  return { min: MIN_GRAMMARS, max, adjustable: max > MIN_GRAMMARS };
}

export function effectiveCount(available: number, requested: number): number {
  const { min, max, adjustable } = countRange(available);
  return adjustable ? Math.min(max, Math.max(min, requested)) : max;
}

type Param = string | string[] | undefined;

const first = (value: Param) => (Array.isArray(value) ? value[0] : value);

export type GrammarParams = { areas: string[] | null; count: number; blitz: number };

// areas: null — все области. Неизвестные ключи отсеивает страница, сверив
// их со списком областей из базы.
export function parseGrammarParams(params: { areas?: Param; count?: Param; blitz?: Param }): GrammarParams {
  const areas = [...new Set((first(params.areas) ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
  const count = Number.parseInt(first(params.count) ?? "", 10);
  const blitz = Number.parseInt(first(params.blitz) ?? "", 10);
  return {
    areas: areas.length ? areas : null,
    count: Number.isFinite(count) ? count : MIN_GRAMMARS,
    blitz: Number.isFinite(blitz) ? Math.min(5, Math.max(1, blitz)) : DEFAULT_BLITZ_SECONDS,
  };
}

export function grammarSearch(params: { areas: string[] | null; count: number; blitz: number }): string {
  const search = new URLSearchParams();
  if (params.areas) search.set("areas", params.areas.join(","));
  search.set("count", String(params.count));
  search.set("blitz", String(params.blitz));
  return search.toString().replace(/%2C/g, ",");
}
