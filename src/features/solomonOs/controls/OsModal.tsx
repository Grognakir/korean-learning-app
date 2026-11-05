"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import theme from "../OsTheme.module.css";
import styles from "./OsModal.module.css";
import { useModalDrag } from "./useModalDrag";

export function OsModal({ label, title, children, onClose, restoreFocus, wide = false, compact = false, draggable = false, dimmed = true }: {
  label: string; title: string; children: ReactNode; onClose: () => void; restoreFocus: () => void; wide?: boolean; compact?: boolean; draggable?: boolean; dimmed?: boolean;
}) {
  const dialog = useRef<HTMLElement>(null), backdrop = useRef<HTMLDivElement>(null);
  const close = useRef(onClose), restore = useRef(restoreFocus);
  const id = useId();
  const [viewport, setViewport] = useState(() => ({ top: window.visualViewport?.offsetTop ?? 0, left: window.visualViewport?.offsetLeft ?? 0, height: window.visualViewport?.height ?? window.innerHeight, width: window.visualViewport?.width ?? window.innerWidth }));
  const drag = useModalDrag(draggable, dialog, backdrop, viewport);
  useEffect(() => { close.current = onClose; restore.current = restoreFocus; });
  useEffect(() => { const field = dialog.current?.querySelector<HTMLElement>("[data-os-autofocus]"); if (field) field.focus(); else if (!dialog.current?.contains(document.activeElement)) dialog.current?.focus(); }, [label]);
  useEffect(() => {
    const background = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && !element.contains(backdrop.current));
    const previous = background.map((element) => ({ element, inert: element.getAttribute("inert"), hidden: element.getAttribute("aria-hidden") }));
    previous.forEach(({ element }) => { element.setAttribute("inert", ""); element.setAttribute("aria-hidden", "true"); });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.current?.contains(document.activeElement)) dialog.current?.focus();
    const resize = () => setViewport({ top: window.visualViewport?.offsetTop ?? 0, left: window.visualViewport?.offsetLeft ?? 0, height: window.visualViewport?.height ?? window.innerHeight, width: window.visualViewport?.width ?? window.innerWidth });
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      previous.forEach(({ element, inert, hidden }) => {
        if (inert === null) element.removeAttribute("inert"); else element.setAttribute("inert", inert);
        if (hidden === null) element.removeAttribute("aria-hidden"); else element.setAttribute("aria-hidden", hidden);
      });
      document.body.style.overflow = overflow;
      restore.current();
    };
  }, []);
  return createPortal(<div ref={backdrop} className={`${theme.theme} ${styles.backdrop}`} data-dimmed={dimmed} style={{ top: viewport.top, left: viewport.left, height: viewport.height, width: viewport.width }} onPointerDown={(event) => { if (event.target === event.currentTarget) close.current(); }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-label={label} aria-describedby={id} tabIndex={-1} className={styles.dialog} data-wide={wide} data-compact={compact} data-draggable={draggable} style={drag.style} onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); close.current(); }
      if (event.key === "Tab") {
        const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]') ?? []).filter((element) => !element.closest("[hidden]"));
        if (!nodes.length) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === nodes[0] || document.activeElement === dialog.current)) { event.preventDefault(); nodes.at(-1)?.focus(); }
        else if (!event.shiftKey && (document.activeElement === nodes.at(-1) || document.activeElement === dialog.current)) { event.preventDefault(); nodes[0]?.focus(); }
      }
    }}>
      <header className={styles.header} data-draggable={draggable} data-dragging={drag.dragging} {...drag.handlers}><h2 id={id} className="kr">{title}</h2><button type="button" onClick={() => close.current()} aria-label="Закрыть диалог" title="Закрыть"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></header>
      <div className={styles.body}>{children}</div>
    </section>
  </div>, document.body);
}
