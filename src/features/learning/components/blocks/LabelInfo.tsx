import styles from "./blocks.module.css";

// Та же ховер/фокус-механика, что у VocabChip (TextBlock.tsx) — просто
// текст на русском вместо корейского слова, без JS-состояния.
export function LabelInfo({ translation }: { translation: string }) {
  return (
    <span className={styles.labelInfo}>
      <button
        type="button"
        className={styles.labelInfoButton}
        aria-label={`Перевод: ${translation}`}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
          <rect x="7.25" y="7.1" width="1.5" height="5" rx="0.75" fill="currentColor" />
        </svg>
      </button>
      <span className={styles.labelInfoTooltip} role="tooltip">
        {translation}
      </span>
    </span>
  );
}
