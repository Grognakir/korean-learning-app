"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { entryKind, findDuplicate, groupNames, type DictionaryData, type EntryResult } from "./entries";
import { LIBRARY_PAGE_SIZE, loadLibrary } from "./loadLibrary";
import { KIND_LABELS, type EntryKind, type LibraryRecord, type SourceRef } from "./reference";
import { ReferenceDetails } from "./ReferenceDetails";
import styles from "./Dictionary.module.css";

export function Library({ data, onImport, onEdit, focus }: { data: DictionaryData; onImport: (record: LibraryRecord, groups: string[]) => EntryResult; onEdit: (id: string) => void; focus?: SourceRef }) {
  const [kind, setKind] = useState<EntryKind>(focus?.kind ?? "word"), [query, setQuery] = useState("");
  const [debounced] = useDebouncedValue(query, 300);
  const [page, setPage] = useState(1), [retry, setRetry] = useState(0);
  const [source, setSource] = useState(focus?.id), [selected, setSelected] = useState<LibraryRecord | null>(null);
  const [result, setResult] = useState<{ records: LibraryRecord[]; count: number } | null>(null), [error, setError] = useState(false);
  const [group, setGroup] = useState(""), [importError, setImportError] = useState("");
  const request = useRef(0);
  useEffect(() => {
    const id = ++request.current;
    let active = true;
    loadLibrary(kind, debounced, page, source).then((next) => {
      if (!active || request.current !== id) return;
      setResult(next); setError(false);
      if (source && next.records[0]) setSelected(next.records[0]);
    }).catch(() => { if (active && request.current === id) { setError(true); setResult(null); } });
    return () => { active = false; };
  }, [kind, debounced, page, source, retry]);
  const existing = selected && (data.words.find((word) => word.source?.id === selected.id && word.source.kind === selected.kind)
    ?? findDuplicate(data.words, selected.ko, undefined, selected.kind));
  return <div className={styles.library}>
    <div className={styles.kindTabs} role="group" aria-label="Тип общего словаря">{(Object.keys(KIND_LABELS) as EntryKind[]).map((id) => <button key={id} type="button" aria-pressed={kind === id} onClick={() => { setKind(id); setSource(undefined); setPage(1); setSelected(null); setResult(null); setImportError(""); }}>{KIND_LABELS[id][0]}<small>{KIND_LABELS[id][1]}</small></button>)}</div>
    {selected ? <div className={styles.libraryDetail}><div className={styles.actions}><button type="button" onClick={() => { setSelected(null); setImportError(""); }}>‹ 목록 · К списку</button>{existing ? <button type="button" className={styles.primary} onClick={() => onEdit(existing.id)}>내 사전 · В моей коллекции</button> : <button type="button" className={styles.primary} onClick={() => {
      const next = onImport(selected, group ? [group] : []);
      setImportError(next.error ? next.error === "full" ? "Коллекция заполнена (2000 записей)." : "Не удалось добавить запись. Проверьте длину названия или перевода." : "");
    }}>＋ 내 사전 · В мою коллекцию</button>}</div>
      {!existing && <div className={styles.groupPicker}><label>그룹 · В группу<input aria-label="그룹 · В группу" value={group} onChange={(e) => setGroup(e.target.value)} autoComplete="off" placeholder="Название своей группы"/></label>{groupNames(data).length > 0 && <div className={styles.groupSuggestions}>{groupNames(data).map((name) => <button type="button" key={name} aria-pressed={group === name} onClick={() => setGroup(group === name ? "" : name)}>{name}</button>)}</div>}</div>}
      {importError && <p role="alert" className={styles.error}>{importError}</p>}
      {existing && <p role="status" className={styles.saved}>저장됨 · Сохранено{entryKind(existing) === "grammar" ? " · Справочник" : ""}</p>}
      <ReferenceDetails record={selected}/>
    </div> : <>
      <input aria-label="Поиск в общем словаре" placeholder="검색 · Поиск по корейскому или русскому" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); setSource(undefined); setResult(null); setError(false); }}/>
      {source && <button type="button" onClick={() => { setSource(undefined); setResult(null); }}>전체 · Все записи</button>}
      {error ? <div className={styles.empty} role="alert">Общий словарь недоступен.<button type="button" onClick={() => { setError(false); setResult(null); setRetry((value) => value + 1); }}>다시 · Повторить</button></div> : !result ? <p role="status" className={styles.hint}>불러오는 중 · Загружаем…</p> : <>
        <p className={styles.count}>Общий словарь · {result.count}</p>
        <ul className={styles.libraryList}>{result.records.map((record) => <li key={`${record.kind}:${record.id}`}><button type="button" onClick={() => { setSelected(record); setImportError(""); }}><b className="kr">{record.ko}</b><small>{record.ru}</small><span>›</span></button></li>)}</ul>
        {!result.records.length && <p className={styles.empty}>Ничего не найдено.</p>}
        {result.count > LIBRARY_PAGE_SIZE && <nav className={styles.pagination} aria-label="Страницы общего словаря"><button type="button" aria-label="Предыдущая страница" disabled={page === 1} onClick={() => { setPage(page - 1); setResult(null); }}>‹</button><span>{page} / {Math.ceil(result.count / LIBRARY_PAGE_SIZE)}</span><button type="button" aria-label="Следующая страница" disabled={page * LIBRARY_PAGE_SIZE >= result.count} onClick={() => { setPage(page + 1); setResult(null); }}>›</button></nav>}
      </>}
    </>}
  </div>;
}
