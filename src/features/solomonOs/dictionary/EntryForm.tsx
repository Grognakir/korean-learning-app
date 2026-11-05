"use client";

import { useId, useRef, useState } from "react";
import { entryKind, entryLimits, type DictionaryEntry, type EntryError, type EntryInput, type EntryResult } from "./entries";
import { KIND_LABELS, type EntryKind } from "./reference";
import { ReferenceDetails } from "./ReferenceDetails";
import { EntryGroups } from "./EntryGroups";
import { useTranslationAutofill } from "./useTranslationAutofill";
import { TranslationSource } from "./TranslationSource";
import styles from "./Dictionary.module.css";
import formStyles from "./EntryForm.module.css";

const ERRORS: Record<EntryError, [string, string]> = {
  korean: ["한국어로 써 주세요.", "Напишите по-корейски."], translation: ["번역은 러시아어로.", "Перевод — по-русски."],
  koLength: ["60자까지 써 주세요.", "Корейское слово — до 60 символов."], ruLength: ["120자까지 써 주세요.", "Перевод — до 120 символов."],
  duplicate: ["이미 있어요.", "Такое слово уже есть."], full: ["가득 찼어요.", "Словарь заполнен."], missing: ["단어가 없어요.", "Слово уже удалено."],
};
export function EntryForm({ entry, availableGroups = [], onSave, onCancel, onDuplicate, onSource, focus }: {
  entry?: DictionaryEntry; onSave: (input: EntryInput) => EntryResult;
  availableGroups?: string[];
  onCancel: () => void; onDuplicate: (entry: DictionaryEntry) => void; onSource?: () => void; focus: boolean;
}) {
  const [ko, setKo] = useState(entry?.ko ?? ""), [manualRu, setRu] = useState<string | null>(entry?.ru ?? null);
  const [result, setResult] = useState<EntryResult | null>(null);
  const [kind, setKind] = useState<EntryKind>(entry ? entryKind(entry) : "word");
  const [groups, setGroups] = useState(entry?.groups?.join(", ") ?? ""), [notes, setNotes] = useState(entry?.notes ?? "");
  const suggested = useTranslationAutofill(ko, kind, !entry);
  const ru = manualRu ?? suggested?.ru ?? "";
  const source = suggested ?? (entry?.reference?.ko.trim().normalize("NFC") === ko.trim().normalize("NFC") ? entry.reference : undefined);
  const limits = entryLimits(kind, Boolean(entry?.reference || suggested));
  const koreanInput = useRef<HTMLInputElement>(null);
  const errorId = useId();
  return <form noValidate className={`${styles.form} ${formStyles.editor}`} aria-label="Запись в словаре" onKeyDown={(event) => { if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault(); }} onSubmit={(event) => {
    event.preventDefault();
    const next = onSave({ id: entry?.id, ko, ru, kind, groups: groups.split(","), notes, ...(suggested ? { source: { kind: suggested.kind, id: suggested.id }, reference: suggested } : {}) });
    setResult(next);
    if (!next.error) {
      if (!entry) { setKo(""); setRu(null); setNotes(""); }
      koreanInput.current?.focus();
    }
  }}>
    <div className={formStyles.writing}>
    <div>
    <label className={formStyles.entryLine}><span className={styles.srOnly}>한국어 · Корейский</span><input className={`${formStyles.field} ${formStyles.korean}`} data-os-autofocus ref={koreanInput} autoFocus={focus} name="ko" lang="ko" value={ko} onChange={(e) => { setKo(e.target.value); setResult(null); }} placeholder="Корейское название" autoComplete="off" autoCapitalize="none" aria-invalid={Boolean(result?.error && ["korean", "koLength", "duplicate"].includes(result.error))} aria-describedby={result?.error ? errorId : undefined}/></label>
    <div className={`${formStyles.entryLine} ${formStyles.translationLine}`}><label><span className={styles.srOnly}>번역 · Перевод</span><input className={formStyles.field} name="ru" lang="ru" value={ru} onChange={(e) => { setRu(e.target.value); setResult(null); }} placeholder="Русский перевод" autoComplete="off" aria-invalid={Boolean(result?.error && ["translation", "ruLength"].includes(result.error))} aria-describedby={result?.error ? errorId : undefined}/></label>{source?.ru && <TranslationSource key={`${source.kind}:${source.id}`} translation={source.ru}/>}</div>
    <textarea className={`${formStyles.field} ${formStyles.note}`} aria-label="Заметка записи" name="notes" placeholder="Пояснение или ассоциация…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}/>
    </div>
    <div className={formStyles.metadata}>
      <EntryGroups value={groups} available={availableGroups} onChange={setGroups}/>
      <div className={formStyles.kinds} role="group" aria-label="Тип записи">{(Object.keys(KIND_LABELS) as EntryKind[]).map((value) => <button key={value} type="button" className={formStyles.kind} aria-label={KIND_LABELS[value].join(" · ")} aria-pressed={kind === value} onClick={() => { setKind(value); setResult(null); }}>{KIND_LABELS[value][1]}</button>)}</div>
    </div>
    {kind === "grammar" && <p className={styles.hint}>Справочная запись · в тренировки не входит.</p>}
    {result?.error && <div id={errorId} role="alert" className={styles.error}><span className="kr">{ERRORS[result.error][0]}</span><small>{result.error === "koLength" ? `Название — до ${limits.ko} символов.` : result.error === "ruLength" ? `Перевод — до ${limits.ru} символов.` : ERRORS[result.error][1]}</small>{result.duplicate && <button type="button" onClick={() => onDuplicate(result.duplicate!)}>수정 · Открыть слово</button>}</div>}
    </div>
    {entry?.reference && <div className={formStyles.reference}>{entry.source && onSource && <button type="button" data-entry-action onClick={onSource}>원문 · Открыть источник</button>}<details><summary>Сохранённая справка</summary><ReferenceDetails record={entry.reference}/></details></div>}
    {entry?.source && !entry.reference && onSource && <div className={formStyles.reference}><button type="button" data-entry-action onClick={onSource}>원문 · Открыть источник</button></div>}
    <div className={formStyles.footer}>{result?.entry && !result.error && <p role="status" className={formStyles.saved}>저장했어요. · Сохранено</p>}<button className={formStyles.cancel} type="button" data-entry-action onClick={onCancel}>취소 · Отмена</button><button className={formStyles.submit} type="submit" data-entry-action>{entry ? "저장 · Сохранить" : "추가 · Добавить"}</button></div>
  </form>;
}
