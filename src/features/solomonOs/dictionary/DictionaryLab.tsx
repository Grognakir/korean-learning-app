"use client";

import Link from "next/link";
import { useState } from "react";
import { OsStorageProvider, useOsStore } from "../OsStorage";
import { TOPICS } from "../wordTrainer/topics";
import { Dictionary } from "./Dictionary";
import { DICTIONARY_LAYOUTS, type DictionaryLayout } from "./layouts";
import { readDictionary, writeDictionary, type DictionaryData } from "./entries";
import type { LibraryRecord } from "./reference";
import styles from "./DictionaryLab.module.css";

export function sampleDictionary(references: LibraryRecord[]): DictionaryData {
  const sample = TOPICS[0].words.filter((word) => ["color:red", "color:black", "color:blue", "item:dress_shirt", "item:coat", "item:bag", "item:sneakers", "verb:입다", "verb:신다"].includes(word.id));
  return { v: 1, words: [
    ...sample.map((word, index) => ({ id: `preview:${word.id}`, ko: word.ko, ru: word.ru, createdAt: 100 + index, updatedAt: 100 + index, ok: index % 3, fail: index % 4, groups: [word.group === "color" ? "Цвета" : word.group === "verb" ? "Глаголы" : "Одежда"] })),
    ...references.map((reference, index) => ({ id: `preview:${reference.id}`, ko: reference.ko, ru: reference.ru, kind: reference.kind, reference, groups: [reference.kind === "grammar" ? "Грамматика" : "В кафе"], createdAt: 200 + index, updatedAt: 200 + index, ok: 0, fail: 0 })),
  ] };
}
export function DictionaryLab({ userId, references }: { userId: string; references: LibraryRecord[] }) {
  return <OsStorageProvider userId={`${userId}:dictionary-design-lab`} migrateLegacy={false}><Lab references={references}/></OsStorageProvider>;
}
function Lab({ references }: { references: LibraryRecord[] }) {
  const store = useOsStore();
  const [layout, setLayout] = useState<DictionaryLayout>(() => {
    if (!store.load("dictionaryDesignSeed", false)) {
      if (!readDictionary(store).words.length) writeDictionary(store, sampleDictionary(references));
      store.save("dictionaryDesignSeed", true);
    }
    const saved = store.load<string>("dictionaryLayout", "catalog");
    return DICTIONARY_LAYOUTS.find((item) => item.id === saved)?.id ?? "catalog";
  });
  const variant = DICTIONARY_LAYOUTS.find((item) => item.id === layout) ?? { name: "Узкие группы", detail: "Выбранный каталог и форма заметки" };
  return <main className={styles.lab}>
    <header className={styles.top}><Link href="/os">← Solomon OS</Link><span>단어장 · Словарь</span><small>Сравнение интерфейсов</small></header>
    <div className={styles.layout}><aside className={styles.controls} aria-label="Дизайн словаря"><button type="button" className={styles.selectedDesign} aria-label="Выбранный дизайн: Узкие группы" aria-pressed={layout === "catalog"} onClick={() => { setLayout("catalog"); store.save("dictionaryLayout", "catalog"); }}><b>✓</b><span>Выбранный</span></button><nav aria-label="7 вариантов словаря">{DICTIONARY_LAYOUTS.map((item, index) => <button type="button" key={item.id} aria-label={`Вариант ${index + 1}: ${item.name}`} aria-pressed={layout === item.id} title={item.detail} onClick={() => { setLayout(item.id); store.save("dictionaryLayout", item.id); }}><b>{index + 1}</b><span>{item.name}</span></button>)}</nav><p><b>{variant.name}</b><small>{variant.detail}</small></p><small className={styles.notice}>Демонстрационные записи. Личная коллекция не меняется.</small></aside>
      <section className={styles.surface} aria-label="Предпросмотр словаря"><div className={styles.titlebar}><b>▤　단어장</b><span aria-hidden="true">—　□　×</span></div><div className={styles.content}><Dictionary layout={layout}/></div></section>
    </div>
  </main>;
}
