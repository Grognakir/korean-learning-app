"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { formatReading } from "@/features/dictionary/formatReading";
import type { Word } from "@/features/dictionary/types";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import { plural } from "@/lib/plural";
import { recordReview } from "../actions";
import type { Sm2Rating } from "../sm2";
import styles from "./FlashcardSession.module.css";

type Props = {
  guest?: boolean;
  queue: { word: Word; isNew: boolean }[];
};

const RATINGS: { rating: Sm2Rating; label: string; className: string }[] = [
  { rating: "again", label: "Забыл", className: styles.again },
  { rating: "hard", label: "Трудно", className: styles.hard },
  { rating: "good", label: "Хорошо", className: styles.good },
  { rating: "easy", label: "Легко", className: styles.easy },
];

function CardBack({ word, reverse }: { word: Word; reverse: boolean }) {
  const translations = (word.translations ?? []).map((t) => t.text).filter(Boolean);
  const examples = word.word_examples ?? [];

  return (
    <div className={styles.back}>
      {reverse && <>
        <p className={`${styles.headword} ${word.language === "ko" ? "kr" : ""}`}>{word.headword}</p>
        {word.reading && <p className={styles.reading}>{formatReading(word.reading)}</p>}
      </>}
      {!reverse && translations.length > 0 && (
        <p className={styles.translations}>{translations.join(", ")}</p>
      )}
      {examples.length > 0 && (
        <ul className={styles.examples}>
          {examples.map((ex, i) => (
            <li key={i} className={styles.example}>
              <span className={word.language === "ko" ? "kr" : undefined}>{ex.kr}</span>
              <span className={styles.exampleRu}>{ex.ru}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Сколько карточек пропустить перед повторным показом слова, отвеченного
// "Забыл" — так же, как учебные шаги (learning steps) в Anki: слово не
// пропадает до завтра, а возвращается в этой же сессии, но не сразу
// подряд (эффект интервала важен и в пределах одной сессии).
const REINSERT_AFTER = 4;

export function FlashcardSession({ queue, guest = false }: Props) {
  const [items, setItems] = useState(queue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<"forward" | "reverse">("forward");
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className={styles.done}>
        <h2 className={styles.doneTitle}>Всё повторено</h2>
        <p className={styles.empty}>Пока нет карточек для этой подборки. Можно изменить категории или добавить слова в словарь.</p>
        <Link href="/dictionary" className={styles.backLink}>Открыть словарь →</Link>
      </div>
    );
  }

  if (index >= items.length) {
    const newCount = queue.filter((item) => item.isNew).length;
    return (
      <div className={styles.done}>
        <span className={styles.eyebrow}>Хорошая работа</span>
        <h2 className={styles.doneTitle}>Сессия завершена</h2>
        <p className={styles.resultNumber}>{index}<span> {plural(index, guest ? ["ответ", "ответа", "ответов"] : ["ответ сохранён", "ответа сохранено", "ответов сохранено"])}</span></p>
        <p className={styles.doneText}>
          Карточек: {queue.length}, из них новых: {newCount}.
        </p>
        <Link href="/learning/trainers" className={styles.backLink}>
          К тренажёрам →
        </Link>
      </div>
    );
  }

  const { word } = items[index];
  const reading = word.reading ? formatReading(word.reading) : "";
  const translations = (word.translations ?? []).map((item) => item.text).filter(Boolean).join(", ");
  const reverse = direction === "reverse" && Boolean(translations);

  async function rate(rating: Sm2Rating) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const result = guest ? { ok: true } : await recordReview(word.id, rating);
      if (result.error) {
        setError("Оценка не сохранена. Попробуйте нажать её ещё раз.");
        return;
      }

      if (rating === "again") {
        setItems((prev) => {
          const current = { ...prev[index], isNew: false };
          const rest = prev.slice(index + 1);
          const insertAt = Math.min(REINSERT_AFTER, rest.length);
          return [
            ...prev.slice(0, index + 1),
            ...rest.slice(0, insertAt),
            current,
            ...rest.slice(insertAt),
          ];
        });
      }

      setFlipped(false);
      setIndex((i) => i + 1);
    } catch {
      setError("Не удалось сохранить оценку. Проверьте соединение и повторите.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      {guest && <p className={styles.doneText}>Тренировка без регистрации. <Link href="/login">Войдите</Link>, чтобы сохранять прогресс.</p>}
      {error && <p className={styles.pendingBanner} role="alert">{error}</p>}
      {saving && <p role="status">Сохраняем оценку…</p>}
      <div className={styles.directions} role="group" aria-label="Направление карточек">
        {(["forward", "reverse"] as const).map((value) => <button
          key={value} type="button" aria-pressed={direction === value} disabled={saving}
          className={direction === value ? styles.directionActive : styles.direction}
          onClick={() => { setDirection(value); setFlipped(false); }}
        >{value === "forward" ? "Слово → перевод" : "Перевод → слово"}</button>)}
      </div>
      <SessionProgress completed={index} total={items.length} label={items[index].isNew ? "Новое слово" : "Повторение"} />
      {flipped ? (
        <button
          type="button"
          className={styles.card}
          disabled={saving}
          onClick={() => setFlipped(false)}
          aria-label="Скрыть ответ"
        >
          <span className={styles.eyebrow}>Ответ</span>
          <CardBack word={word} reverse={reverse} />
        </button>
      ) : (
        <button
          type="button"
          className={styles.cardButton}
          onClick={() => setFlipped(true)}
          aria-label="Показать ответ"
        >
          <span className={styles.eyebrow}>{reverse ? "Вспомните слово" : "Вспомните перевод"}</span>
          <span className={`${styles.headword} ${!reverse && word.language === "ko" ? "kr" : ""}`}>
            {reverse ? translations : word.headword}
          </span>
          {!reverse && reading ? <span className={styles.reading}>{reading}</span> : null}
          <span className={styles.hint}>Нажмите, чтобы перевернуть</span>
        </button>
      )}
      {flipped && (
        <div className={styles.ratings}>
          {RATINGS.map((item) => (
            <button
              key={item.rating}
              type="button"
              className={item.className}
              disabled={saving}
              onClick={() => void rate(item.rating)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
