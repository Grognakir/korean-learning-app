/**
 * Русская плюрализация: forms — [1 категория, 2 категории, 5 категорий].
 */
export function plural(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100;
  const tens = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (tens > 1 && tens < 5) return forms[1];
  if (tens === 1) return forms[0];
  return forms[2];
}
