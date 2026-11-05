import type { OsStore } from "../store";
import type { EntryKind, LibraryRecord, SourceRef } from "./reference";

export type DictionaryEntry = {
  id: string; ko: string; ru: string; createdAt: number; updatedAt: number;
  ok: number; fail: number; lastAt?: number;
  kind?: EntryKind; groups?: string[]; notes?: string; source?: SourceRef; reference?: LibraryRecord;
};
export type EntryInput = { ko: string; ru: string; id?: string; kind?: EntryKind; groups?: string[]; notes?: string; source?: SourceRef; reference?: LibraryRecord };
export type DictionaryData = { v: 1; words: DictionaryEntry[] };
export type EntryError = "korean" | "translation" | "koLength" | "ruLength" | "duplicate" | "full" | "missing";
export type EntryResult = { data: DictionaryData; entry?: DictionaryEntry; error?: EntryError; duplicate?: DictionaryEntry };
export const DICTIONARY_KEY = "dictionary";
export const MAX_WORDS = 2000;
export const emptyDictionary = (): DictionaryData => ({ v: 1, words: [] });
export const tidy = (value: string) => value.trim().replace(/\s+/gu, " ");
export const normalizeKorean = (value: string) => value.normalize("NFC").replace(/\s/gu, "").toLowerCase();
const hangul = /[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7af\ud7b0-\ud7ff]/u;
export const koreanVariants = (value: string) => [...new Set(value.split("/").map(tidy).filter(Boolean))];
export function russianVariants(value: string): string[] {
  let depth = 0, part = "";
  const parts: string[] = [];
  for (const char of value) {
    if (char === "(" || char === "（") depth++;
    if (char === ")" || char === "）") depth = Math.max(0, depth - 1);
    if ((char === "," || char === ";") && depth === 0) { parts.push(tidy(part)); part = ""; }
    else part += char;
  }
  parts.push(tidy(part));
  return [...new Set(parts.filter(Boolean))];
}
export const entryKind = (word: DictionaryEntry) => word.kind ?? "word";
export const groupNames = (data: DictionaryData) => [...new Set(data.words.flatMap((word) => word.groups ?? []))].sort((a, b) => a.localeCompare(b, "ru"));
export const trainableWords = (data: DictionaryData) => data.words.filter((word) => entryKind(word) !== "grammar" && russianVariants(word.ru).length > 0);
export function findDuplicate(words: DictionaryEntry[], ko: string, exceptId?: string, kind: EntryKind = "word") {
  const keys = new Set(koreanVariants(ko).map(normalizeKorean));
  return words.find((word) => word.id !== exceptId && entryKind(word) === kind && koreanVariants(word.ko).some((variant) => keys.has(normalizeKorean(variant))));
}
export function entryLimits(kind: EntryKind = "word", imported = false) { return { ko: kind === "word" ? 60 : 500, ru: imported ? 4000 : kind === "word" ? 120 : 1000 }; }
export function putEntry(data: DictionaryData, input: EntryInput, now = Date.now(), newId = crypto.randomUUID()): EntryResult {
  const ko = tidy(input.ko), ru = tidy(input.ru);
  const previous = input.id ? data.words.find((word) => word.id === input.id) : undefined;
  const kind = input.kind ?? previous?.kind ?? "word";
  const limits = entryLimits(kind, Boolean(input.reference ?? previous?.reference));
  const imported = Boolean(input.reference ?? previous?.reference);
  const error = !ko || !imported && !hangul.test(ko) ? "korean" : hangul.test(ru) && !imported ? "translation" : ko.length > limits.ko ? "koLength" : ru.length > limits.ru ? "ruLength" : undefined;
  if (error) return { data, error };
  if (input.id && !previous) return { data, error: "missing" };
  const duplicate = findDuplicate(data.words, ko, input.id, kind);
  if (duplicate) return { data, error: "duplicate", duplicate };
  if (!previous && data.words.length >= MAX_WORDS) return { data, error: "full" };
  const entry: DictionaryEntry = previous ? { ...previous, ko, ru, updatedAt: now }
    : { id: newId, ko, ru, createdAt: now, updatedAt: now, ok: 0, fail: 0 };
  if (input.kind) entry.kind = input.kind;
  if (input.groups) entry.groups = [...new Set(input.groups.map(tidy).filter(Boolean))];
  if (input.notes !== undefined) entry.notes = input.notes.trim();
  if (input.source) entry.source = { ...input.source };
  if (input.reference) entry.reference = structuredClone(input.reference);
  return { data: { v: 1, words: previous ? data.words.map((word) => word.id === entry.id ? entry : word) : [...data.words, entry] }, entry };
}
export const deleteEntry = (data: DictionaryData, id: string): DictionaryData => ({ ...data, words: data.words.filter((word) => word.id !== id) });
export function recordAnswer(data: DictionaryData, id: string, correct: boolean, now = Date.now()): DictionaryData {
  return { ...data, words: data.words.map((word) => word.id === id ? { ...word, ok: word.ok + Number(correct), fail: word.fail + Number(!correct), lastAt: now } : word) };
}
export function searchWords(data: DictionaryData, search: string, sort: "new" | "alpha") {
  const query = tidy(search).normalize("NFC").toLocaleLowerCase();
  return [...data.words].reverse().filter((word) => `${word.ko} ${word.ru} ${word.notes ?? ""}`.normalize("NFC").toLocaleLowerCase().includes(query))
    .sort((a, b) => sort === "alpha" ? a.ko.localeCompare(b.ko, "ko") : b.createdAt - a.createdAt);
}
export function readDictionary(store: OsStore): DictionaryData {
  const value = store.load<DictionaryData | null>(DICTIONARY_KEY, null);
  if (value?.v !== 1 || !Array.isArray(value.words)) return emptyDictionary();
  const ids = new Set<string>();
  const words = value.words.filter((word) => {
    const limits = entryLimits(word?.kind, Boolean(word?.reference));
    const valid = word && typeof word.id === "string" && !ids.has(word.id) && typeof word.ko === "string" && typeof word.ru === "string"
      && Boolean(word.ko) && (word.reference || hangul.test(word.ko) && !hangul.test(word.ru)) && word.ko.length <= limits.ko && word.ru.length <= limits.ru
      && (!word.kind || ["word", "phrase", "grammar"].includes(word.kind)) && (!word.groups || Array.isArray(word.groups) && word.groups.every((g) => typeof g === "string"))
      && [word.createdAt, word.updatedAt, word.ok, word.fail].every((n) => Number.isFinite(n) && n >= 0);
    if (valid) ids.add(word.id);
    return valid;
  }).slice(0, MAX_WORDS);
  return { v: 1, words };
}
export function importRecord(data: DictionaryData, reference: LibraryRecord, groups: string[] = [], now = Date.now()): EntryResult {
  const linked = data.words.find((word) => word.source?.id === reference.id && word.source.kind === reference.kind);
  if (linked) return { data, error: "duplicate", duplicate: linked };
  return putEntry(data, { ko: reference.ko, ru: reference.ru, kind: reference.kind, source: { kind: reference.kind, id: reference.id }, reference, groups }, now);
}
const listeners = new Map<string, Set<() => void>>();
const scope = (store: OsStore) => store.userId ?? "";
export function subscribeDictionary(store: OsStore, callback: () => void) {
  const key = scope(store), callbacks = listeners.get(key) ?? new Set();
  callbacks.add(callback);
  listeners.set(key, callbacks);
  return () => { callbacks.delete(callback); if (!callbacks.size) listeners.delete(key); };
}
export function writeDictionary(store: OsStore, data: DictionaryData) {
  store.save(DICTIONARY_KEY, data);
  listeners.get(scope(store))?.forEach((callback) => callback());
}
export function saveAnswer(store: OsStore, id: string, correct: boolean, now = Date.now()) {
  const data = readDictionary(store);
  if (data.words.some((word) => word.id === id)) writeDictionary(store, recordAnswer(data, id, correct, now));
}
