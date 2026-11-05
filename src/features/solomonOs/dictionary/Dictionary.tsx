"use client";

import { useRef, useState } from "react";
import { OsModal } from "../controls/OsModal";
import { DictionaryIcon } from "./DictionaryIcon";
import { EntryDetails } from "./EntryDetails";
import { EntryForm } from "./EntryForm";
import { Flashcards } from "./Flashcards";
import { Library } from "./Library";
import { WordList } from "./WordList";
import { useDictionary } from "./useDictionary";
import { groupNames, type DictionaryEntry, type EntryInput } from "./entries";
import type { DictionaryLayout } from "./layouts";
import type { SourceRef } from "./reference";
import styles from "./Dictionary.module.css";

type Dialog = { type: "entry"; id?: string } | { type: "cards" } | { type: "library"; focus?: SourceRef } | { type: "read"; id: string } | { type: "delete"; entry: DictionaryEntry };
const TITLES = { cards: ["Тренировка карточек", "카드 · Тренировка карточек"], library: ["Общий словарь", "전체 사전 · Общий словарь"], read: ["Просмотр записи", "단어장 · Запись"], delete: ["Подтверждение удаления", "삭제 · Удаление"] };

export function Dictionary({ layout = "catalog" }: { layout?: DictionaryLayout } = {}) {
  const dictionary = useDictionary();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const plus = useRef<HTMLButtonElement>(null);
  const entry = dialog && "id" in dialog ? dictionary.data.words.find((word) => word.id === dialog.id) : undefined;
  const open = (next: Dialog) => {
    if (!dialog) opener.current = document.activeElement as HTMLElement;
    setDialog(next);
  };
  const close = () => setDialog(null);
  const restoreFocus = () => { if (opener.current?.isConnected) opener.current.focus(); else plus.current?.focus(); };
  const openEntry = (word?: DictionaryEntry) => open({ type: "entry", id: word?.id });
  const openSource = (word?: DictionaryEntry) => open({ type: "library", focus: word?.source });
  const save = (input: EntryInput) => {
    const result = dictionary.put(input);
    if (!result.error && input.id) close();
    return result;
  };
  const title = dialog?.type === "entry" ? [entry ? "Редактирование слова" : "Добавление слова", entry ? "수정 · Изменить запись" : "추가 · Добавить запись"] : dialog ? TITLES[dialog.type] : [];
  return <div className={styles.shell}>
    <div className={styles.dictionary} data-dictionary-layout={layout}>
      <WordList layout={layout} data={dictionary.data} selected={entry?.id} onSelect={(word) => layout === "reference" ? open({ type: "read", id: word.id }) : openEntry(word)} onEdit={openEntry} onDelete={(word) => open({ type: "delete", entry: word })} actions={<div className={styles.toolbarActions} role="group" aria-label="Действия словаря">
        <button ref={plus} type="button" className={`${styles.iconButton} ${styles.primary}`} aria-label="Новая запись" title="Добавить запись" onClick={() => openEntry()}><DictionaryIcon name="plus"/></button>
        <button type="button" className={styles.iconButton} aria-label="Тренировка карточек" title="Тренировка карточек" onClick={() => open({ type: "cards" })}><DictionaryIcon name="cards"/></button>
        <button type="button" className={styles.iconButton} aria-label="Общий словарь" title="Общий словарь" onClick={() => open({ type: "library" })}><DictionaryIcon name="book"/></button>
      </div>}/>
    </div>
    {dialog && <OsModal label={title[0]} title={title[1]} onClose={close} restoreFocus={restoreFocus} wide={dialog.type === "library"} compact={dialog.type === "entry"} draggable={dialog.type === "entry"} dimmed={dialog.type !== "entry"}>
      <div className={`${styles.dictionary} ${styles.modalContent}`}>
        {dialog.type === "entry" && (dialog.id && !entry ? <div className={styles.confirm}><p role="alert">Эта запись уже удалена.</p><button type="button" onClick={close}>닫기 · Закрыть</button></div> : <EntryForm key={dialog.id ?? "new"} entry={entry} availableGroups={groupNames(dictionary.data)} focus onSave={save} onCancel={close} onDuplicate={openEntry} onSource={() => openSource(entry)}/>)}
        {dialog.type === "cards" && <Flashcards data={dictionary.data} onAnswer={dictionary.answer}/>}
        {dialog.type === "library" && <Library key={dialog.focus ? `${dialog.focus.kind}:${dialog.focus.id}` : "all"} data={dictionary.data} onImport={dictionary.import} focus={dialog.focus} onEdit={(id) => open({ type: "entry", id })}/>}
        {dialog.type === "read" && <EntryDetails entry={entry} onBack={close} onEdit={() => openEntry(entry)} onNew={() => openEntry()} onSource={() => openSource(entry)}/>}
        {dialog.type === "delete" && <div className={styles.confirm}><b className="kr">정말 삭제할까요?</b><p>Удалить эту запись?</p><p className="kr">{dialog.entry.ko}</p><div className={styles.actions}><button className={styles.danger} type="button" onClick={() => { dictionary.remove(dialog.entry.id); close(); }}>삭제 · Удалить</button><button type="button" autoFocus onClick={close}>취소 · Отмена</button></div></div>}
      </div>
    </OsModal>}
  </div>;
}
