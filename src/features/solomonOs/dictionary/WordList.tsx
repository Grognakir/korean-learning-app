"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { entryKind, groupNames, russianVariants, searchWords, trainableWords, type DictionaryData, type DictionaryEntry } from "./entries";
import { KIND_LABELS, type EntryKind } from "./reference";
import { OsSelect } from "../controls/OsSelect";
import { DictionaryIcon } from "./DictionaryIcon";
import type { DictionaryLayout } from "./layouts";
import styles from "./Dictionary.module.css";
import catalogStyles from "./Catalog.module.css";

export function WordList({ data, selected, onSelect, onEdit, onDelete, layout = "catalog", actions }: {
  data: DictionaryData; selected?: string; onSelect: (entry: DictionaryEntry) => void; onEdit: (entry: DictionaryEntry) => void;
  onDelete: (entry: DictionaryEntry) => void; layout?: DictionaryLayout; actions?: ReactNode;
}) {
  const [query, setQuery] = useState(""), [sort, setSort] = useState<"new" | "alpha">("new");
  const [kind, setKind] = useState<EntryKind | "all">("all"), [chosenGroup, setGroup] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRoot = useRef<HTMLDivElement>(null), filterButton = useRef<HTMLButtonElement>(null);
  const filterId = useId();
  const names = groupNames(data), group = names.includes(chosenGroup) ? chosenGroup : "";
  const catalog = layout === "catalog";
  const filtered = kind !== "all" || Boolean(group) || sort !== "new";
  const words = searchWords(data, query, sort).filter((word) => (kind === "all" || entryKind(word) === kind) && (!group || word.groups?.includes(group)));
  useEffect(() => {
    if (!filtersOpen) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!filterRoot.current?.contains(target) && !target.closest('[data-os-select-menu]')) setFiltersOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [filtersOpen]);
  const tags = (word: DictionaryEntry) => [...new Set([word.kind && word.kind !== "word" ? KIND_LABELS[word.kind][1] : "", ...(word.groups ?? [])].filter(Boolean))].join(" · ");
  const stats = (word: DictionaryEntry) => word.ok + word.fail > 0 && <small className={styles.wordStats}>✓ {word.ok} · × {word.fail}</small>;
  const rowActions = (word: DictionaryEntry) => <div className={`${styles.rowActions} ${catalog ? catalogStyles.rowActions : ""}`}>{catalog && stats(word)}<button type="button" className={styles.iconButton} aria-label={`Изменить: ${word.ko}`} title="Изменить" onClick={() => onEdit(word)}><DictionaryIcon name="edit"/></button><button type="button" className={`${styles.iconButton} ${styles.danger}`} aria-label={`Удалить: ${word.ko}`} title="Удалить" onClick={() => onDelete(word)}><DictionaryIcon name="delete"/></button></div>;
  const row = (word: DictionaryEntry) => <li key={word.id} className={catalog ? catalogStyles.row : undefined} data-selected={selected === word.id}>
    <button type="button" className={`${styles.word} ${catalog ? catalogStyles.word : ""}`} aria-label={catalog ? word.ko : undefined} onClick={() => onSelect(word)}><b className="kr">{word.ko}</b><span>{russianVariants(word.ru).length ? word.ru : "без перевода"}</span>{!catalog && <><small className={styles.wordTags}>{tags(word)}</small>{stats(word)}</>}</button>{rowActions(word)}
  </li>;
  const collections = layout === "groups" && !group
    ? [...names.map((name) => ({ name, words: words.filter((word) => word.groups?.includes(name)) })), { name: "Без группы", words: words.filter((word) => !word.groups?.length) }].filter((collection) => collection.words.length)
    : [{ name: "", words }];
  const count = <p className={`${styles.count} ${catalog ? catalogStyles.footer : ""}`}>всего {data.words.length} · в тренировке {trainableWords(data).length}{filtered && <span> · показано {words.length}</span>}</p>;
  return <section className={`${styles.listPanel} ${catalog ? catalogStyles.catalog : ""}`} aria-label="Слова словаря">
    <div className={styles.tools}><input aria-label="검색 / Поиск" placeholder="검색 / Поиск" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off"/>
      <div ref={filterRoot} className={styles.filterRoot}><button ref={filterButton} type="button" className={styles.iconButton} aria-label="Фильтры словаря" title="Фильтры и сортировка" aria-expanded={filtersOpen} aria-controls={filterId} data-active={filtered} onClick={() => setFiltersOpen((value) => !value)}><DictionaryIcon name="filter"/></button>
        {filtersOpen && <div className={styles.filterPopover} id={filterId} role="group" aria-label="Фильтры словаря" onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setFiltersOpen(false); filterButton.current?.focus(); } }}>
          <div className={styles.filters}><OsSelect label="Тип личных записей" value={kind} onChange={(value) => setKind(value as EntryKind | "all")} options={[{ value: "all", label: "전체 · Все типы" }, ...(Object.keys(KIND_LABELS) as EntryKind[]).map((value) => ({ value, label: KIND_LABELS[value].join(" · ") }))]}/><OsSelect label="Группа личных записей" value={group} onChange={setGroup} options={[{ value: "", label: "Все группы" }, ...names.map((value) => ({ value, label: value }))]}/></div>
          <div className={styles.sortOptions} role="group" aria-label="Сортировка"><button type="button" aria-pressed={sort === "new"} onClick={() => setSort("new")}>최신 · Сначала новые</button><button type="button" aria-pressed={sort === "alpha"} onClick={() => setSort("alpha")}>가나다 · По алфавиту</button></div>
          {filtered && <button className={styles.resetFilters} type="button" onClick={() => { setKind("all"); setGroup(""); setSort("new"); }}>초기화 · Сбросить</button>}
        </div>}
      </div>{actions}
    </div>
    {!catalog && count}
    {layout === "overview" && <div className={styles.overview}><div><b>{data.words.length}</b><span>Всего записей</span></div><div><b>{trainableWords(data).length}</b><span>В тренировке</span></div><div><b>{data.words.filter((word) => word.fail > word.ok).length}</b><span>Сложные</span></div></div>}
    <div className={`${styles.collectionBody} ${catalog ? catalogStyles.workspace : ""}`}>
      {catalog && <nav className={catalogStyles.rail} aria-label="Коллекции"><div className={catalogStyles.railTitle}>그룹 · Группы</div>{["", ...names].map((name) => <button key={name} type="button" className={catalogStyles.group} title={name || "Все записи"} aria-label={name ? `Группа: ${name}` : "Все записи"} aria-pressed={group === name} onClick={() => setGroup(name)}><span className={catalogStyles.groupName}><DictionaryIcon name={name ? "folder" : "list"}/><span>{name || "Все"}</span></span><span className={catalogStyles.groupCount}>{name ? data.words.filter((word) => word.groups?.includes(name)).length : data.words.length}</span></button>)}</nav>}
      {layout === "explorer" && names.length > 0 && <nav className={styles.folderRail} aria-label="Коллекции"><button type="button" aria-pressed={!group} onClick={() => setGroup("")}>▤ Все записи</button>{names.map((name) => <button key={name} type="button" aria-pressed={group === name} onClick={() => setGroup(name)}>▤ {name}</button>)}</nav>}
      <div className={styles.listScroll}>
        {catalog && <div className={catalogStyles.heading}><span>{group || "Все записи"}</span><span aria-label="Показано записей">{words.length}</span></div>}
        {layout === "table" && words.length > 0 ? <table className={styles.wordTable} aria-label="Таблица слов"><thead><tr><th scope="col">한국어</th><th scope="col">Перевод</th><th scope="col">Группы</th><th scope="col"><span className={styles.srOnly}>Действия</span></th></tr></thead><tbody>{words.map((word) => <tr key={word.id} data-selected={selected === word.id}><td><button type="button" className={`${styles.wordLink} kr`} onClick={() => onSelect(word)}>{word.ko}</button><small className={styles.mobileMeta}>{tags(word)}</small></td><td>{russianVariants(word.ru).length ? word.ru : <small>без перевода</small>}</td><td><small>{tags(word)}</small>{stats(word)}</td><td>{rowActions(word)}</td></tr>)}</tbody></table>
          : collections.map((collection) => <section key={collection.name} className={styles.collection}>{collection.name && <h4>{collection.name}<small>{collection.words.length}</small></h4>}<ul className={styles.wordList}>{collection.words.map(row)}</ul></section>)}
        {!data.words.length && <div className={styles.empty}><b className="kr">아직 단어가 없어요.</b><p>Пока нет слов. Добавьте первое.</p></div>}
        {data.words.length > 0 && !words.length && <p className={styles.empty}>검색 결과가 없어요. · Ничего не найдено</p>}
      </div>
    </div>
    {catalog && count}
  </section>;
}
