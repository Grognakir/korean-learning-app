"use client";

import styles from "./ListError.module.css";

export function ListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.root} role="status">
      <span>Не удалось загрузить — проверьте соединение.</span>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}
