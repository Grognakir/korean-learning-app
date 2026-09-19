"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import styles from "./SessionSettings.module.css";

const COMPACT_QUERY = "(max-width: 1000px)";

export function SessionSettings({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(COMPACT_QUERY);
    const update = () => setCompact(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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
      {!compact && (
        <div id={panelId} className={open ? styles.panelOpen : styles.panel}>
          {children}
        </div>
      )}
      {compact && (
        <Modal open={open} onClose={() => setOpen(false)} title="Настройки карточек">
          <h2 className={styles.modalTitle}>Настройки карточек</h2>
          <div id={panelId} className={styles.modalBody}>{children}</div>
        </Modal>
      )}
    </div>
  );
}
