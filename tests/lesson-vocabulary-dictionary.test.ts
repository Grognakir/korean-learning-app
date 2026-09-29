import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type DictionaryWord = {
  external_id: string;
  headword: string;
  translations: string[];
};

type LocalVocab = {
  ko: string;
  translation_ru: string;
};

function lessonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return lessonFiles(path);
    return /lesson-\d+\.json$/.test(entry.name) ? [path] : [];
  });
}

function collectLocalVocab(value: unknown, result: LocalVocab[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectLocalVocab(item, result));
    return;
  }
  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  if (typeof record.ko === "string" && typeof record.translation_ru === "string") {
    result.push({ ko: record.ko, translation_ru: record.translation_ru });
  }
  Object.values(record).forEach((item) => collectLocalVocab(item, result));
}

describe("словарное покрытие уроков", () => {
  const dictionary = JSON.parse(
    readFileSync(join(process.cwd(), "content/dictionary/words.json"), "utf8"),
  ) as { words: DictionaryWord[] };
  const headwords = new Set(dictionary.words.map((word) => word.headword));
  const compactHeadwords = new Set(
    dictionary.words.map((word) => word.headword.replace(/\s+/g, "")),
  );

  it("не содержит повторяющихся внешних идентификаторов", () => {
    const ids = dictionary.words.map((word) => word.external_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("содержит перевод для каждой словарной статьи", () => {
    const withoutTranslation = dictionary.words
      .filter((word) => word.translations.length === 0)
      .map((word) => word.headword);
    expect(withoutTranslation).toEqual([]);
  });

  it("покрывает все слова, явно размеченные в текстах и заданиях", () => {
    const localVocab: LocalVocab[] = [];
    for (const file of lessonFiles(
      join(process.cwd(), "content/reference/inha_book_content"),
    )) {
      collectLocalVocab(JSON.parse(readFileSync(file, "utf8")), localVocab);
    }

    const missing = localVocab.filter(({ ko, translation_ru }) => {
      if (headwords.has(ko) || compactHeadwords.has(ko.replace(/\s+/g, ""))) {
        return false;
      }
      const sourceLemma = translation_ru.match(/форма от ([가-힣]+)/)?.[1];
      return !sourceLemma || !headwords.has(sourceLemma);
    });

    expect(missing).toEqual([]);
  });
});
