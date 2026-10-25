"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Заголовок в одной строке с крестиком (крестик по центру строки). */
  heading?: ReactNode;
  /** Широкое окно для чтения с почти невидимой полосой прокрутки. */
  reading?: boolean;
};

export function Modal({ open, onClose, children, title, heading, reading = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Блокируем прокрутку на <html>, а не на <body>: у body уже стоит
    // overflow: clip, и overflow: hidden на нём делает body собственным
    // контейнером прокрутки — страница под окном прыгала в начало.
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    const prevPaddingRight = root.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    document.addEventListener("keydown", handleKeyDown);
    root.style.overflow = "hidden";
    if (scrollbarWidth > 0) root.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      root.style.overflow = prevOverflow;
      root.style.paddingRight = prevPaddingRight;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={reading ? `${styles.dialog} ${styles.dialogReading}` : styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {heading ? (
          <div className={styles.header}>
            <h2 className={styles.heading}>{heading}</h2>
            <button
              type="button"
              className={styles.closeInline}
              onClick={onClose}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        )}
        <div className={reading ? `${styles.body} ${styles.bodyQuiet}` : styles.body}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
