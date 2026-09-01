"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { formatReading } from "@/features/dictionary/formatReading";
import type { Word } from "@/features/dictionary/types";
import { plural } from "@/lib/plural";
import { recordReview } from "../actions";
import type { Sm2Rating } from "../sm2";
import styles from "./FlashcardSession.module.css";

type Props = {
  queue: { word: Word; isNew: boolean }[];
};

const RATINGS: { rating: Sm2Rating; label: string; className: string }[] = [
  { rating: "again", label: "Забыл", className: styles.again },
  { rating: "hard", label: "Трудно", className: styles.hard },
  { rating: "good", label: "Хорошо", className: styles.good },
  { rating: "easy", label: "Легко", className: styles.easy },
];

function CardBack({ word }: { word: Word }) {
  const translations = (word.translations ?? []).map((t) => t.text).filter(Boolean);
  const examples = word.word_examples ?? [];

  return (
    <div className={styles.back}>
      {translations.length > 0 && (
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

type PendingReview = { wordId: string; rating: Sm2Rating };

async function sendReview(review: PendingReview): Promise<boolean> {
  try {
    const result = await recordReview(review.wordId, review.rating);
    if (result && "error" in result && result.error) {
      console.error("FlashcardSession:", result.error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("FlashcardSession:", e);
    return false;
  }
}

export function FlashcardSession({ queue }: Props) {
  const [items, setItems] = useState(queue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Оценки, которые так и не доехали до сервера. Держим их, чтобы
  // прогресс SRS не терялся молча: раньше упавший запрос уходил только
  // в консоль.
  const pendingRef = useRef<PendingReview[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  async function submit(review: PendingReview) {
    // Одна автоматическая попытка: сеть в дороге моргает чаще, чем
    // сервер отдаёт настоящую ошибку.
    if (await sendReview(review)) return;
    if (await sendReview(review)) return;
    pendingRef.current = [...pendingRef.current, review];
    setPendingCount(pendingRef.current.length);
  }

  async function retryPending() {
    setRetrying(true);
    const batch = pendingRef.current;
    pendingRef.current = [];
    const failed: PendingReview[] = [];
    for (const review of batch) {
      if (!(await sendReview(review))) failed.push(review);
    }
    pendingRef.current = [...failed, ...pendingRef.current];
    setPendingCount(pendingRef.current.length);
    setRetrying(false);
  }

  const pendingBanner = pendingCount > 0 && (
    <div className={styles.pendingBanner} role="status">
      <span>
        Прогресс не сохранён: {pendingCount}{" "}
        {plural(pendingCount, ["оценка", "оценки", "оценок"])}.
      </span>
      <button
        type="button"
        className={styles.pendingRetry}
        onClick={() => void retryPending()}
        disabled={retrying}
      >
        {retrying ? "Отправляем…" : "Повторить"}
      </button>
    </div>
  );

  if (items.length === 0) {
    return (
      <p className={styles.empty}>Пока нечего повторять. Загляните позже.</p>
    );
  }

  if (index >= items.length) {
    const newCount = queue.filter((item) => item.isNew).length;
    return (
      <div className={styles.done}>
        {pendingBanner}
        <h2 className={styles.doneTitle}>Сессия завершена</h2>
        <p className={styles.doneText}>
          Карточек: {queue.length}, из них новых: {newCount}.
        </p>
        <Link href="/learning/trainers/flashcards" className={styles.backLink}>
          Назад
        </Link>
      </div>
    );
  }

  const { word } = items[index];
  const reading = word.reading ? formatReading(word.reading) : "";

  function rate(rating: Sm2Rating) {
    void submit({ wordId: word.id, rating });

    if (rating === "again") {
      setItems((prev) => {
        const current = prev[index];
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
  }

  return (
    <div className={styles.root}>
      {pendingBanner}
      <p className={styles.progress}>
        {index + 1} / {items.length}
      </p>
      {flipped ? (
        <button
          type="button"
          className={styles.card}
          onClick={() => setFlipped(false)}
          aria-label="Вернуться к слову"
        >
          <CardBack word={word} />
        </button>
      ) : (
        <button
          type="button"
          className={styles.cardButton}
          onClick={() => setFlipped(true)}
          aria-label="Показать ответ"
        >
          <span
            className={`${styles.headword} ${word.language === "ko" ? "kr" : ""}`}
          >
            {word.headword}
          </span>
          {reading ? <span className={styles.reading}>{reading}</span> : null}
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
              onClick={() => rate(item.rating)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
