"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./TranslationSource.module.css";

export function TranslationSource({ translation }: { translation: string }) {
  const [open, setOpen] = useState(false), [pinned, setPinned] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) { setOpen(false); setPinned(false); } };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div ref={root} className={styles.source} onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!pinned) setOpen(false); }} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); setPinned(false); }
  }}>
    <button type="button" className={styles.trigger} aria-label="Источник перевода" aria-expanded={open} aria-describedby={open ? id : undefined} onFocus={() => setOpen(true)} onBlur={() => { if (!pinned) setOpen(false); }} onClick={() => { setPinned(!pinned); setOpen(!pinned); }}><span aria-hidden="true">!</span></button>
    {open && <div className={styles.tooltip} role="tooltip" id={id}>Перевод из общего словаря: <span>{translation}</span><small>Можно изменить или стереть в поле перевода.</small></div>}
  </div>;
}
