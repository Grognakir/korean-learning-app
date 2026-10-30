"use client";

import { useEffect, useRef, useState } from "react";
import { OsIcon } from "./icons";
import { unreadNotes, type OsNote } from "./notifications";
import { koTime } from "./useOsPhone";
import styles from "./SolomonOs.module.css";

function when(at: number): string {
  const d = new Date(at);
  return new Date().toDateString() === d.toDateString() ? koTime(d) : `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** Колокольчик на панели: счётчик непрочитанных, по нажатию — список
 * уведомлений (открытие списка отмечает их прочитанными). */
export function NoteBell({
  notes,
  avatar,
  onOpenNote,
  onReadAll,
  onClear,
  onTest,
}: {
  notes: OsNote[];
  avatar: string;
  onOpenNote: (note: OsNote) => void;
  onReadAll: () => void;
  onClear: () => void;
  /** Кнопка рядом с колокольчиком: показать тестовое уведомление. */
  onTest: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const unread = unreadNotes(notes);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className={styles.bellBox} ref={box}>
      <button
        type="button"
        className={styles.bell}
        aria-label="Тестовое уведомление"
        title="Тестовое уведомление"
        onClick={onTest}
      >
        <OsIcon name="refresh" />
      </button>
      <button
        type="button"
        className={styles.bell}
        aria-label={`Уведомления${unread ? `: ${unread} новых` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) onReadAll();
        }}
      >
        <OsIcon name="bell" />
        {unread > 0 && <b className={styles.bellBadge}>{unread}</b>}
      </button>
      {open && (
        <div className={`${styles.notePanel} kr`} role="dialog" aria-label="Уведомления">
          <div className={styles.noteHead}>
            <b>알림</b>
            {notes.length > 0 && (
              <button type="button" className={styles.noteClear} onClick={onClear}>
                Очистить
              </button>
            )}
          </div>
          {notes.length === 0 ? (
            <p className={styles.empty}>Уведомлений нет.</p>
          ) : (
            <ul className={styles.noteList}>
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={styles.noteItem}
                    onClick={() => {
                      setOpen(false);
                      onOpenNote(n);
                    }}
                  >
                    <span className={styles.ava}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className={styles.holo} src={avatar} alt="" />
                    </span>
                    <span className={styles.meta}>
                      <b>{n.who}</b>
                      <small>{n.text}</small>
                    </span>
                    <span className={styles.time}>{when(n.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
