"use client";

import { useEffect, useRef, useState } from "react";
import { TOC } from "./toc";
import styles from "./TopicTocMenu.module.css";

/** Оглавление темы в нижней панели (только компактные ширины, где панель
 * видна): тап открывает список, на устройствах с мышью — ещё и наведение. */
export function TopicTocMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onPointerEnter={(event) => event.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setOpen(false)}
    >
      <button
        type="button"
        className={`${styles.button} ${open ? styles.buttonOpen : ""}`}
        aria-expanded={open}
        aria-controls="topic-toc-menu"
        aria-label="Содержание темы"
        onClick={() => setOpen((value) => !value)}
      >
        <svg className={styles.icon} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <path
            d="M4 5.5h12M4 10h12M4 14.5h8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className={styles.label}>Разделы</span>
      </button>
      {open && (
        <div className={styles.popup} id="topic-toc-menu">
          <nav className={styles.card} aria-label="Содержание темы">
            <ul className={styles.list}>
              {TOC.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={styles.item} onClick={() => setOpen(false)}>
                    <span className={styles.number}>{item.number}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
