"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./SessionSettings.module.css";

/**
 * На узком экране настройки сессии съедали половину высоты до карточки,
 * поэтому здесь они сворачиваются в одну строку со сводкой. На широких
 * экранах панель раскрыта всегда, а кнопка скрыта — этим управляет CSS,
 * так что состояние ниже влияет только на компактную вёрстку.
 */
export function SessionSettings({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.summary}>{summary}</span>
        <span className={open ? styles.chevronOpen : styles.chevron} aria-hidden="true">
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
            <path
              d="M3 4.5 6 7.5 9 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div id={panelId} className={open ? styles.panelOpen : styles.panel}>
        {children}
      </div>
    </div>
  );
}
