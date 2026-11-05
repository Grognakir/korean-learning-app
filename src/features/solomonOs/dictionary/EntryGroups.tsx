"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tidy } from "./entries";
import { useGroupMenu } from "./useGroupMenu";
import theme from "../OsTheme.module.css";
import styles from "./EntryGroups.module.css";

export function EntryGroups({ value, available, onChange }: { value: string; available: string[]; onChange: (value: string) => void }) {
  const selected = [...new Set(value.split(",").map(tidy).filter(Boolean))];
  const [query, setQuery] = useState(selected[0] ?? ""), [open, setOpen] = useState(false), [editing, setEditing] = useState(false);
  const [created, setCreated] = useState<string[]>([]), [error, setError] = useState(""), [active, setActive] = useState(-1);
  const control = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const names = [...new Set([...available, ...created, ...selected])].sort((a, b) => a.localeCompare(b, "ru"));
  const clean = tidy(query), lower = (text: string) => text.toLocaleLowerCase("ru");
  const matches = names.filter((name) => !editing || lower(name).includes(lower(clean)));
  const canCreate = editing && Boolean(clean) && !names.some((name) => lower(name) === lower(clean)) && !clean.includes(",");
  const visible = open && matches.length > 0;
  const position = useGroupMenu(control, visible, matches.length);
  const close = () => { setOpen(false); setActive(-1); setError(""); };
  const choose = (name: string, toggle = false) => {
    const nextName = tidy(name);
    if (!nextName) return;
    if (nextName.includes(",")) { setError("Создавайте группы по одной, без запятых."); return; }
    const existing = names.find((item) => lower(item) === lower(nextName)), next = existing ?? nextName;
    if (!existing) setCreated((items) => [...items, next]);
    const groups = toggle && selected.includes(next) ? selected.filter((item) => item !== next) : [...new Set([...selected, next])];
    onChange(groups.join(", ")); setQuery(groups.includes(next) ? next : groups[0] ?? ""); setEditing(false); input.current?.focus(); close();
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!target.closest('header[data-draggable="true"]') && !control.current?.contains(target) && !menu.current?.contains(target)) { setOpen(false); setActive(-1); setError(""); }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => { menu.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" }); }, [active]);
  return <div ref={control} className={styles.control}>
    <input ref={input} className={styles.input} role="combobox" aria-label="Группа записи" aria-expanded={visible} aria-controls={visible ? id : undefined} aria-autocomplete="list" aria-activedescendant={visible && active >= 0 ? `${id}-${active}` : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} placeholder="Группа" value={query} title={selected.join(", ")} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onBlur={(event) => { if (!control.current?.contains(event.relatedTarget) && !menu.current?.contains(event.relatedTarget)) close(); }} onChange={(event) => { setQuery(event.target.value); setEditing(true); setOpen(true); setActive(-1); setError(""); }} onKeyDown={(event) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive((index) => matches.length ? (index < 0 ? (event.key === "ArrowDown" ? 0 : matches.length - 1) : (index + (event.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length) : -1); }
      if (event.key === "Enter") { event.preventDefault(); choose(active >= 0 && visible ? matches[active] : names.find((name) => lower(name) === lower(clean)) ?? (canCreate || clean.includes(",") ? query : matches[0] ?? query)); }
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === "Tab") close();
    }}/>
    {selected.length > 1 && <span className={styles.count} title={selected.join(", ")}>+{selected.length - 1}</span>}
    {canCreate && <button type="button" className={styles.add} aria-label="Добавить группу" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(query)}>+</button>}
    {error && <small id={`${id}-error`} role="alert" className={styles.error}>{error}</small>}
    {visible && position && createPortal(<div ref={menu} id={id} data-os-select-menu="" role="listbox" aria-label="Группы записи" aria-multiselectable="true" className={`${theme.theme} ${styles.menu}`} style={position}>{matches.map((name, index) => <button key={name} id={`${id}-${index}`} data-index={index} type="button" role="option" tabIndex={-1} aria-selected={selected.includes(name)} className={`${styles.option} ${index === active ? styles.active : ""}`} onPointerDown={(event) => event.preventDefault()} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(name, true)}><span>{name}</span>{selected.includes(name) && <span aria-hidden="true">✓</span>}</button>)}</div>, document.body)}
  </div>;
}
