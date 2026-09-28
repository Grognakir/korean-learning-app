// В шаблоне ilike спецсимволы LIKE (% и _) и звёздочка, которую PostgREST
// сам превращает в %, работают как подстановочные знаки — без
// экранирования запрос «100_» вернёт мусор вместо ничего. Обратный слэш —
// escape-символ LIKE по умолчанию, поэтому экранируем и его самого,
// обязательно первым.
export function escapeLike(value: string): string {
  return value.replace(/[\\%_*]/g, (char) => `\\${char}`);
}

// PostgREST's `.or()`/`.filter()` string DSL uses "," to separate
// conditions and "()" for grouping — a value containing them (already
// escaped for LIKE by escapeLike above) would otherwise break the filter
// syntax when interpolated into an .or(...) string. Wrapping the value in
// double quotes and escaping backslashes/quotes inside it is PostgREST's
// own documented way to pass a literal value through that parser.
export function quoteForOrFilter(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
