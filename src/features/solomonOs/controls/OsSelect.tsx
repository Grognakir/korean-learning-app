"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import theme from "../OsTheme.module.css";
import styles from "./OsSelect.module.css";

export type OsOption = { value: string; label: string };
type Position = { top: number; left: number; width: number; maxHeight: number; transform?: string };
export function OsSelect({ value, options, onChange, label, placeholder = "Выбрать" }: { value: string; options: OsOption[]; onChange: (value: string) => void; label: string; placeholder?: string }) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(0), [position, setPosition] = useState<Position>();
  const trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const id = useId(), typed = useRef({ text: "", at: 0 });
  const selected = options.find((option) => option.value === value);
  const close = (focus = true) => { setOpen(false); if (focus) trigger.current?.focus(); };
  const show = (last = false) => { setActive(last ? options.length - 1 : Math.max(0, options.findIndex((option) => option.value === value))); setOpen(true); };
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);
      const width = Math.min(Math.max(rect.width, 160), window.innerWidth - 16);
      const below = bottom - rect.bottom - 12, above = rect.top - (viewport?.offsetTop ?? 0) - 12;
      const height = Math.min(260, Math.max(80, below >= 140 || below >= above ? below : above));
      setPosition({ top: below >= 140 || below >= above ? rect.bottom + 4 : rect.top - 4, transform: below >= 140 || below >= above ? undefined : "translateY(-100%)", left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), width, maxHeight: height });
    };
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false); };
    place();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);
  useEffect(() => { if (open && position) menu.current?.focus(); }, [open, position]);
  useEffect(() => { if (open) menu.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" }); }, [active, open]);
  return <div className={styles.select}>
    <button ref={trigger} type="button" className={styles.trigger} role="combobox" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="listbox" onClick={() => open ? close() : show()} onKeyDown={(event) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); show(event.key === "ArrowUp"); }
    }}><span>{selected?.label ?? placeholder}</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg></button>
    {open && position && createPortal(<div ref={menu} data-os-select-menu="" id={id} role="listbox" aria-label={label} aria-activedescendant={`${id}-${active}`} tabIndex={-1} className={`${theme.theme} ${styles.menu}`} style={position} onKeyDown={(event) => {
      if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape", "Tab"].includes(event.key)) {
        event.stopPropagation();
        if (event.key !== "Tab") event.preventDefault();
        if (event.key === "ArrowDown") setActive((index) => (index + 1) % options.length);
        if (event.key === "ArrowUp") setActive((index) => (index - 1 + options.length) % options.length);
        if (event.key === "Home") setActive(0);
        if (event.key === "End") setActive(options.length - 1);
        if (["Enter", " "].includes(event.key) && options[active]) { onChange(options[active].value); close(); }
        if (event.key === "Escape") close();
        if (event.key === "Tab") close();
      } else if (event.key.length === 1) {
        const now = Date.now();
        typed.current = { text: now - typed.current.at < 700 ? typed.current.text + event.key : event.key, at: now };
        const index = options.findIndex((option) => option.label.toLocaleLowerCase().startsWith(typed.current.text.toLocaleLowerCase()));
        if (index >= 0) setActive(index);
      }
    }}>{options.map((option, index) => <button type="button" role="option" tabIndex={-1} id={`${id}-${index}`} key={option.value} data-index={index} data-active={index === active} aria-selected={option.value === value} onPointerMove={() => setActive(index)} onClick={() => { onChange(option.value); close(); }}><span>{option.label}</span><i aria-hidden="true">{option.value === value ? "✓" : ""}</i></button>)}</div>, document.body)}
  </div>;
}
