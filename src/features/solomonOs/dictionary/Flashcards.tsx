"use client";

import { useRef, useState } from "react";
import { answerText, questionText, type CardMode } from "./answers";
import { entryKind, groupNames, type DictionaryData } from "./entries";
import { answerCard, minimumWords, nextCard, repeatCards, scopedWords, startCards, stopCards, type CardScope, type CardSession } from "./session";
import { OsSelect } from "../controls/OsSelect";
import styles from "./Dictionary.module.css";

const MODES: { id: CardMode; ko: string; ru: string }[] = [
  { id: "ko-ru", ko: "한 → 러 · 고르기", ru: "Корейский → Русский · Выбор" },
  { id: "ru-ko", ko: "러 → 한 · 고르기", ru: "Русский → Корейский · Выбор" },
  { id: "typing", ko: "러 → 한 · 쓰기", ru: "Русский → Корейский · Ввод" },
];
export function Flashcards({ data, onAnswer }: { data: DictionaryData; onAnswer: (id: string, correct: boolean) => void }) {
  const [mode, setMode] = useState<CardMode>("ko-ru"), [scope, setScope] = useState<CardScope>("all");
  const [session, setSession] = useState<CardSession | null>(null), [draft, setDraft] = useState("");
  const [group, setGroup] = useState(""), [kind, setKind] = useState("all");
  const current = useRef(session);
  const commit = (next: CardSession | null) => { current.current = next; setSession(next); setDraft(""); };
  const answer = (input: string) => {
    if (!current.current) return;
    const before = current.current, after = answerCard(before, input);
    if (after === before) return;
    commit(after);
    onAnswer(before.words[before.position].id, after.right!);
  };
  const words = scopedWords(data, scope).filter((word) => (!group || word.groups?.includes(group)) && (kind === "all" || entryKind(word) === kind));
  const enough = words.length >= minimumWords(mode);
  if (!session) return <div className={styles.training}>
    <div className={styles.modes} role="group" aria-label="Режим карточек">{MODES.map((item) => <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => setMode(item.id)}><b className="kr">{item.ko}</b><small>{item.ru}</small></button>)}</div>
    <div className={styles.actions} role="group" aria-label="Охват слов"><button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")}>전체 · Все слова</button><button type="button" aria-pressed={scope === "hard"} onClick={() => setScope("hard")}>어려운 단어 · Только сложные</button></div>
    <div className={styles.filters}><OsSelect label="Тип записей для карточек" value={kind} onChange={setKind} options={[{ value: "all", label: "Слова и фразы" }, { value: "word", label: "Слова" }, { value: "phrase", label: "Фразы" }]}/><OsSelect label="Группа для карточек" value={group} onChange={setGroup} options={[{ value: "", label: "Все группы" }, ...groupNames(data).map((value) => ({ value, label: value }))]}/></div>
    <p className={styles.hint}>단어 {words.length} · Слов: {words.length}{!enough && <small>Нужно минимум {minimumWords(mode)} {mode === "typing" ? "слово с переводом" : "слова с переводом"}.{scope === "hard" && " Сложные — ошибок больше, чем верных ответов."}</small>}</p>
    <button type="button" className={styles.primary} disabled={!enough} onClick={() => commit(startCards(words, mode))}>시작 · Начать</button>
  </div>;
  const word = session.words[session.position];
  const answered = session.answered;
  return <div className={styles.training}>
    <div className={styles.progress}><span className="kr">{session.phase === "done" ? Math.min(answered, session.words.length) : session.position + 1} / {session.words.length} · 정답 {session.correct}</span>{session.phase !== "done" && <button type="button" onClick={() => commit(stopCards(current.current!))}>그만하기 · Закончить</button>}</div>
    {session.phase === "done" ? <>
      <h3 className="kr">끝! {session.correct}/{session.words.length}<small>Верно: {session.correct} · Ответов: {Math.min(answered, session.words.length)}</small></h3>
      <div className={styles.actions}><button type="button" disabled={!session.errors.length} onClick={() => commit(repeatCards(session, true))}>틀린 단어 다시 · Повторить ошибки</button><button type="button" onClick={() => commit(repeatCards(session, false))}>한 바퀴 더 · Ещё круг</button><button type="button" onClick={() => commit(null)}>나가기 · Выйти</button></div>
      {session.errors.length > 0 && <ul className={styles.errorWords}>{session.words.filter((entry) => session.errors.includes(entry.id)).map((entry) => <li key={entry.id}><b className="kr">{entry.ko}</b><span>{entry.ru}</span></li>)}</ul>}
    </> : <>
      <div className={styles.card} data-result={session.phase === "feedback" ? session.right ? "right" : "wrong" : undefined}>
        <span className={session.mode === "ko-ru" ? "kr" : undefined}>{questionText(word, session.mode)}</span>
        {session.phase === "feedback" && <div className={styles.feedback} role="status"><b className="kr">{session.right ? "정답! · Верно!" : "정답 · Правильно:"}</b><strong className="kr">{answerText(word, session.mode)}</strong>{session.mode === "typing" && <small>Ваш ответ: {session.input}</small>}</div>}
      </div>
      {session.phase === "feedback" ? <button type="button" className={styles.primary} autoFocus onClick={() => commit(nextCard(current.current!))}>다음 · Дальше</button>
        : session.mode === "typing" ? <form className={styles.inputAnswer} onSubmit={(e) => { e.preventDefault(); answer(draft); }}><label>한국어 · Ответ по-корейски<input autoFocus lang="ko" autoComplete="off" autoCapitalize="none" value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="send" onKeyDown={(e) => { if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault(); }}/></label><button className={styles.primary} type="submit" disabled={!draft.trim()}>입력 · Ответить ↵</button></form>
          : <div className={styles.choices} role="group" aria-label="Ваш ответ">{session.choices.map((choice) => <button className="kr" type="button" key={choice} onClick={() => answer(choice)}>{choice}</button>)}</div>}
    </>}
  </div>;
}
