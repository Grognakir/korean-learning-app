/**
 * Слова, отмеченные в уроках (`{ ko, translation_ru }`), показывают перевод
 * из общего словаря: в JSON урока остаётся только пометка, какое слово нужно.
 * Если слова нет в словаре (форма, выражение), остаётся перевод из урока.
 */
export type DictionaryTranslations = Map<string, string>;

export function collectVocabKeys(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectVocabKeys(item, into);
  } else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.ko === "string" && typeof obj.translation_ru === "string") {
      into.add(obj.ko);
    }
    for (const child of Object.values(obj)) collectVocabKeys(child, into);
  }
  return into;
}

export function applyDictionaryTranslations<T>(value: T, dictionary: DictionaryTranslations): T {
  if (Array.isArray(value)) {
    return value.map((item) => applyDictionaryTranslations(item, dictionary)) as T;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(obj)) {
      result[key] = applyDictionaryTranslations(child, dictionary);
    }
    if (typeof obj.ko === "string" && typeof obj.translation_ru === "string") {
      const fromDictionary = dictionary.get(obj.ko);
      if (fromDictionary) result.translation_ru = fromDictionary;
    }
    return result as T;
  }
  return value;
}

export function joinDictionaryTranslations(
  rows: { external_id?: string | null; text: string }[],
): string {
  const order = (id?: string | null) => Number(/-tr-(\d+)$/.exec(id ?? "")?.[1] ?? 0);
  return [...rows]
    .sort((a, b) => order(a.external_id) - order(b.external_id))
    .map((row) => row.text.trim())
    .filter(Boolean)
    .join("; ");
}
