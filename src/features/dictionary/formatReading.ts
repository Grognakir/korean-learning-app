// В импортированном словаре чтение приходит в разном виде: с косыми,
// запятыми, скобками и служебными пометками. Показываем только латиницу —
// это и есть транслитерация.
export function formatReading(reading: string): string {
  return reading
    .replace(/[/|,;]+/g, " ")
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
