"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Select.module.css";

export type SelectOption = {
  value: string;
  label: string;
};

type MenuCoords = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function menuCoordsFromTrigger(trigger: HTMLElement): MenuCoords {
  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
  const maxHeight = Math.min(280, Math.max(120, spaceBelow));
  return {
    top: rect.bottom + gap,
    left: rect.left,
    width: Math.max(rect.width, 160),
    maxHeight,
  };
}

function Chevron() {
  return (
    <svg
      className={styles.chevron}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
};

export function Select({
  value,
  options,
  onChange,
  placeholder = "Выбрать",
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      setCoords(menuCoordsFromTrigger(triggerRef.current));
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    updateCoords();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, updateCoords]);

  const menuStyle: CSSProperties | undefined = coords
    ? {
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
      }
    : undefined;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={open ? styles.triggerOpen : styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
      >
        <span className={selected ? styles.triggerLabel : styles.placeholder}>
          {label}
        </span>
        <Chevron />
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={menuStyle}
            data-select-menu=""
          >
            <ul
              id={listId}
              className={styles.menuList}
              role="listbox"
              aria-label={ariaLabel}
            >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value || "__empty"} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={
                      isSelected ? styles.optionSelected : styles.option
                    }
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

type MultiSelectProps = {
  values: string[];
  options: SelectOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  "aria-label"?: string;
};

export function MultiSelect({
  values,
  options,
  onChange,
  placeholder = "Выбрать",
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = new Set(values);

  const label =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ?? values[0])
        : `${values.length} категории`;

  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      setCoords(menuCoordsFromTrigger(triggerRef.current));
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    updateCoords();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, updateCoords]);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  };

  const menuStyle: CSSProperties | undefined = coords
    ? {
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
      }
    : undefined;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={open ? styles.triggerOpen : styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
      >
        <span className={values.length ? styles.triggerLabel : styles.placeholder}>
          {label}
        </span>
        <Chevron />
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={menuStyle}
            data-select-menu=""
          >
            <ul
              id={listId}
              className={styles.menuList}
              role="listbox"
              aria-multiselectable="true"
              aria-label={ariaLabel}
            >
            {options.map((option) => {
              const isSelected = selected.has(option.value);
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={
                      isSelected ? styles.optionSelected : styles.option
                    }
                    onClick={() => toggle(option.value)}
                  >
                    <span
                      className={
                        isSelected ? styles.checkOn : styles.checkOff
                      }
                      aria-hidden="true"
                    />
                    {option.label}
                  </button>
                </li>
              );
            })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
