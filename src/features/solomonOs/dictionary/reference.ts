import type { GrammarNoteBlock, GrammarPoint, Phrase, Word } from "@/features/dictionary/types";
import { partOfSpeechLabel } from "@/features/dictionary/partOfSpeechLabels";
import { areaLabel } from "@/features/trainers/grammar/areas";

export type EntryKind = "word" | "phrase" | "grammar";
export type SourceRef = { kind: EntryKind; id: string };
export type ReferenceSection = { title: string; blocks: GrammarNoteBlock[] };
export type LibraryRecord = SourceRef & { ko: string; ru: string; sections: ReferenceSection[] };
export const KIND_LABELS: Record<EntryKind, [string, string]> = { word: ["단어", "Слова"], phrase: ["표현", "Фразы"], grammar: ["문법", "Грамматика"] };
const text = (title: string, value: string | null | undefined): ReferenceSection[] => value ? [{ title, blocks: [{ type: "text", text: value }] }] : [];
const list = (title: string, items: string[] | null | undefined): ReferenceSection[] => items?.length ? [{ title, blocks: [{ type: "bullets", items }] }] : [];
const examples = (title: string, items: { kr: string; ru: string }[] | null | undefined): ReferenceSection[] => items?.length ? [{ title, blocks: [{ type: "examples", items }] }] : [];
export function fromWord(word: Word): LibraryRecord {
  return { id: word.id, kind: "word", ko: word.headword, ru: (word.translations ?? []).map((t) => t.text).join("; "), sections: [
    ...text("Произношение", word.reading), ...text("Часть речи", partOfSpeechLabel(word.part_of_speech)),
    ...list("Категории", (word.word_categories ?? []).flatMap((c) => c.categories ? [c.categories.name] : [])),
    ...examples("Примеры", word.word_examples), ...list("Примечания", (word.word_notes ?? []).map((n) => n.text)),
    ...list("Формы и связи", (word.word_forms ?? []).map((form) => `${form.label ? `${form.label}: ` : ""}${form.value}`)),
  ] };
}
export function fromPhrase(phrase: Phrase): LibraryRecord {
  return { id: phrase.id, kind: "phrase", ko: phrase.phrase_kr, ru: phrase.translation, sections: [
    ...text("Произношение", phrase.reading), ...text("Использование", phrase.usage_note), ...text("Категория", phrase.category),
  ] };
}
export function fromGrammar(point: GrammarPoint): LibraryRecord {
  return { id: point.id, kind: "grammar", ko: point.pattern, ru: point.short_desc ?? "", sections: [
    ...text("Урок", point.lesson_label), ...text("Группа", point.grammar_group ?? (point.category ? areaLabel(point.category) : null)), ...text("Объяснение", point.explanation),
    ...list("Когда используется", point.usage), ...list("Правила", point.rules),
    ...(point.notes ?? []).filter((note) => note.section && !note.after_examples).map(({ title, blocks }) => ({ title, blocks })),
    ...examples("Примеры", point.examples),
    ...(point.notes ?? []).filter((note) => note.after_examples || !note.section).map(({ title, blocks }) => ({ title, blocks })),
    ...examples("Связанные слова", point.vocab),
  ] };
}
