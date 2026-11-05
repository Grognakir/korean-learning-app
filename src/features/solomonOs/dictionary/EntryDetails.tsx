import type { DictionaryEntry } from "./entries";
import { ReferenceDetails } from "./ReferenceDetails";
import { KIND_LABELS } from "./reference";
import styles from "./Dictionary.module.css";

export function EntryDetails({ entry, onEdit, onNew, onSource, onBack }: { entry?: DictionaryEntry; onEdit: () => void; onNew: () => void; onSource: () => void; onBack: () => void }) {
  if (!entry) return <div className={styles.readPane}><h3>내 사전<small>Личная коллекция</small></h3><p className={styles.hint}>Выберите запись или добавьте первую.</p><button type="button" className={styles.primary} onClick={onNew}>＋ 추가 · Добавить</button></div>;
  return <article className={styles.readPane} aria-label={`Запись: ${entry.ko}`}><button type="button" className={styles.readingBack} onClick={onBack}>‹ 목록 · К списку</button><div className={styles.entryMeta}>{KIND_LABELS[entry.kind ?? "word"][1]}{entry.groups?.filter((name) => name !== KIND_LABELS[entry.kind ?? "word"][1]).map((name) => <span key={name}>{name}</span>)}</div><h2 className="kr">{entry.ko}</h2><p>{entry.ru || "Без перевода"}</p>{entry.notes && <p className={styles.personalNote}>{entry.notes}</p>}<div className={styles.actions}><button type="button" onClick={onEdit}>수정 · Изменить</button>{entry.source && <button type="button" onClick={onSource}>원문 · Открыть источник</button>}</div>{entry.reference && <ReferenceDetails record={entry.reference} showTitle={false}/>}</article>;
}
