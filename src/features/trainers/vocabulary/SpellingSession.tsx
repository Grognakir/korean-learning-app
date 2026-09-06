"use client";

import Link from "next/link";
import { plural } from "@/lib/plural";
import { useRef, useState } from "react";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import { makeSpellingItems, type SpellingItem } from "./exercises";
import styles from "./Practice.module.css";

export function SpellingSession({ initialItems }: { initialItems: SpellingItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [mistakes, setMistakes] = useState<SpellingItem[]>([]);
  const lock = useRef(false);
  const prompt = useRef<HTMLHeadingElement>(null);

  function restart(next: SpellingItem[]) {
    setItems(makeSpellingItems(next.map(i => i.word)));
    setIndex(0); setChosen([]); setChecked(false); setHinted(false); setMistakes([]); lock.current = false;
    requestAnimationFrame(() => prompt.current?.focus());
  }

  if (!items.length) return <div className={styles.panel}><h2>Пока недостаточно слов</h2><Link href="/learning/trainers">К тренажёрам →</Link></div>;
  if (index >= items.length) return <div className={styles.panel}>
    <p className={styles.eyebrow}>Тренировка завершена</p><h2 ref={prompt} tabIndex={-1}>Слова стали ближе</h2>
    <p className={styles.score}>{items.length - mistakes.length} / {items.length}</p>
    <p className={styles.description}>Верно без подсказки</p>
    <div className={styles.actions}>
      {!!mistakes.length && <button className={styles.primary} onClick={() => restart(mistakes)}>Закрепить сложные ({mistakes.length})</button>}
      <button className={styles.secondary} onClick={() => restart(initialItems)}>Пройти заново</button>
    </div>
    {!!mistakes.length && <ul className={styles.review} aria-label="Слова для повторения">{mistakes.map(({ word }) => <li key={word.id}><strong lang={word.language}>{word.headword}</strong><span>{word.translation}</span></li>)}</ul>}
    <Link href="/learning/trainers">К тренажёрам →</Link>
  </div>;
  const item = items[index];
  const answer = chosen.map(id => item.tiles.find(t => t.id === id)!.text).join("");
  const correct = answer === item.word.headword;
  function check() {
    if (lock.current || chosen.length !== item.tiles.length) return;
    lock.current = true;
    setChecked(true);
    if (!correct || hinted) setMistakes(prev => [...prev, item]);
  }
  function next() {
    if (!checked || !lock.current) return;
    lock.current = false;
    setIndex(i => i + 1); setChosen([]); setChecked(false); setHinted(false);
    requestAnimationFrame(() => prompt.current?.focus());
  }
  return <div className={styles.root}>
    <SessionProgress completed={index} total={items.length} label="Соберите слово по переводу" />
    <section className={styles.panel}>
      <p className={styles.eyebrow}>{item.word.language === "ko" ? "Из корейских слогов" : "Из английских букв"} · {item.tiles.length} {plural(item.tiles.length, ["знак", "знака", "знаков"])}</p>
      <h2 ref={prompt} tabIndex={-1} className={styles.prompt}>{item.word.translation}</h2>
      <div className={styles.answer} role="group" aria-label="Ваш ответ">
        {!chosen.length && <span className={styles.description}>Нажимайте на знаки снизу</span>}
        {chosen.map((id, position) => <button key={id} className={styles.tile} disabled={checked} aria-label={`Убрать знак ${position + 1}: ${item.tiles.find(t => t.id === id)!.text}`} onClick={() => setChosen(prev => prev.filter(n => n !== id))}>{item.tiles.find(t => t.id === id)!.text}</button>)}
      </div>
      <div className={styles.tiles} role="group" aria-label="Доступные знаки">
        {item.tiles.map((tile, position) => <button key={tile.id} lang={item.word.language} className={styles.tile} disabled={checked || chosen.includes(tile.id)} aria-label={`Добавить ${tile.text}, кнопка ${position + 1}`} onClick={() => setChosen(prev => prev.includes(tile.id) ? prev : [...prev, tile.id])}>{tile.text}</button>)}
      </div>
      {hinted && !checked && <p className={styles.description}>Первый знак: <strong lang={item.word.language}>{Array.from(item.word.headword)[0]}</strong></p>}
      {checked ? <>
        <p className={styles.feedback} role="status">{correct ? "Верно!" : "Запомните написание:"} <strong lang={item.word.language}>{item.word.headword}</strong></p>
        <button className={styles.primary} onClick={next}>{index + 1 === items.length ? "Посмотреть результат" : "Далее"}</button>
      </> : <div className={styles.actions}>
        <button className={styles.secondary} disabled={!chosen.length} onClick={() => setChosen([])}>Очистить</button>
        <button className={styles.secondary} disabled={hinted} onClick={() => setHinted(true)}>Подсказка</button>
        <button className={styles.primary} disabled={chosen.length !== item.tiles.length} onClick={check}>Проверить</button>
      </div>}
    </section>
  </div>;
}
