"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import { makePairRounds, type PairRound } from "./exercises";
import styles from "./Practice.module.css";

export function PairSession({ initialRounds }: { initialRounds: PairRound[] }) {
  const [rounds, setRounds] = useState(initialRounds);
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("Выберите слово и его перевод в любом порядке.");
  const heading = useRef<HTMLHeadingElement>(null);
  const nextLock = useRef(false);

  function restart() {
    setRounds(makePairRounds(initialRounds.flatMap(r => r.words)));
    setIndex(0); setMatched([]); setMistakes(0); setLeft(null); setRight(null);
    setMessage("Выберите слово и его перевод в любом порядке."); nextLock.current = false;
    requestAnimationFrame(() => heading.current?.focus());
  }
  if (!rounds.length) return <div className={styles.panel}><h2>Пока недостаточно слов</h2><Link href="/learning/trainers">К тренажёрам →</Link></div>;
  const total = rounds.reduce((n, r) => n + r.words.length, 0);
  if (index >= rounds.length) return <div className={styles.panel}>
    <p className={styles.eyebrow}>Тренировка завершена</p><h2 ref={heading} tabIndex={-1}>Все пары найдены</h2>
    <p className={styles.score}>{total} / {total}</p><p className={styles.description}>Ошибочных попыток: {mistakes}</p>
    <button className={styles.primary} onClick={restart}>Перемешать и повторить</button>
    <Link href="/learning/trainers">К тренажёрам →</Link>
  </div>;
  const round = rounds[index];
  const done = matched.length === round.words.length;
  function choose(id: string, side: "left" | "right") {
    if (matched.includes(id)) return;
    const a = side === "left" ? id : left;
    const b = side === "right" ? id : right;
    if (a && b) {
      if (a === b) {
        setMatched(prev => prev.includes(a) ? prev : [...prev, a]);
        const word = round.words.find(w => w.id === a)!;
        setMessage(`Верно: ${word.headword} — ${word.translation}`);
      } else {
        setMistakes(n => n + 1);
        setMessage("Эти карточки не составляют пару. Попробуйте ещё раз.");
      }
      setLeft(null); setRight(null);
    } else { setLeft(a); setRight(b); }
  }
  function next() {
    if (!done || nextLock.current) return;
    nextLock.current = true;
    setIndex(i => i + 1); setMatched([]); setLeft(null); setRight(null);
    setMessage("Выберите слово и его перевод в любом порядке.");
    requestAnimationFrame(() => { nextLock.current = false; heading.current?.focus(); });
  }
  const classFor = (id: string, selected: string | null) => `${styles.choice} ${matched.includes(id) ? styles.matched : selected === id ? styles.selected : ""}`;
  return <div className={styles.root}>
    <SessionProgress showCompleted completed={rounds.slice(0, index).reduce((n, r) => n + r.words.length, 0) + matched.length} total={total} label={`Раунд ${index + 1} из ${rounds.length}`} />
    <h2 ref={heading} tabIndex={-1} className={styles.eyebrow}>Соедините слова с переводами · найдено {matched.length} из {round.words.length}</h2>
    <div className={styles.columns}>
      <div className={styles.column} role="group" aria-label="Слова">{round.words.map(word => <button key={word.id} lang={word.language} className={classFor(word.id, left)} aria-pressed={left === word.id} disabled={matched.includes(word.id)} onClick={() => choose(word.id, "left")}>{matched.includes(word.id) && "✓ "}{word.headword}</button>)}</div>
      <div className={styles.column} role="group" aria-label="Переводы">{round.translationIds.map(id => <button key={id} className={classFor(id, right)} aria-pressed={right === id} disabled={matched.includes(id)} onClick={() => choose(id, "right")}>{matched.includes(id) && "✓ "}{round.words.find(w => w.id === id)!.translation}</button>)}</div>
    </div>
    <p className={styles.feedback} role="status">{message}</p>
    {done && <button className={styles.primary} onClick={next}>{index + 1 === rounds.length ? "Посмотреть результат" : "Следующий раунд"}</button>}
  </div>;
}
