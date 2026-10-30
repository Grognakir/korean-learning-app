"use client";

import { useState, type ReactNode } from "react";
import type { OsApp } from "./apps";
import { AppIcon, OsIcon } from "./icons";
import styles from "./SolomonOs.module.css";

export type Geo = { x: number; y: number; w: number; h: number };
export type WinState = { g: Geo; max: boolean; min: boolean; z: number };

const MIN_W = 300;
const MIN_H = 220;

/** Окно нельзя потерять за краем рабочего стола. */
export function clampGeo(g: Geo, desk: { w: number; h: number }): Geo {
  const w = Math.min(Math.max(g.w, MIN_W), Math.max(desk.w, MIN_W));
  const h = Math.min(Math.max(g.h, MIN_H), Math.max(desk.h, MIN_H));
  return {
    w,
    h,
    x: Math.min(Math.max(g.x, -w + 120), desk.w - 120),
    y: Math.min(Math.max(g.y, 0), Math.max(0, desk.h - 34)),
  };
}

type Handle = "r" | "b" | "l" | "br" | "bl";
const HANDLES: Handle[] = ["r", "b", "l", "br", "bl"];

/** Окно Xfce: заголовок с кнопками, перетаскивание, изменение размера.
 * На телефоне (phone) всегда на весь рабочий стол. */
export function OsWindow({
  app,
  title,
  state,
  focused,
  phone,
  desk,
  onFocus,
  onChange,
  onMinimize,
  onClose,
  children,
}: {
  app: OsApp;
  title: string;
  state: WinState;
  focused: boolean;
  phone: boolean;
  desk: { w: number; h: number };
  onFocus: () => void;
  onChange: (next: Partial<WinState>, persist?: boolean) => void;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const max = state.max || phone;
  const g = clampGeo(state.g, desk);

  /** Общий перетаскиватель: «щит» поверх всего, чтобы курсор не терялся. */
  const drag = (
    e: React.PointerEvent,
    cursor: string,
    move: (dx: number, dy: number) => void,
  ) => {
    const sx = e.clientX;
    const sy = e.clientY;
    setDragging(cursor);
    const mv = (ev: PointerEvent) => move(ev.clientX - sx, ev.clientY - sy);
    const up = () => {
      setDragging(null);
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      onChange({}, true);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onTitleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button") || phone || e.button !== 0)
      return;
    e.preventDefault();
    let g0 = { ...g };
    if (state.max) {
      // тянем развёрнутое окно — оно восстанавливается под курсором
      const r =
        e.currentTarget.parentElement!.parentElement!.getBoundingClientRect();
      g0 = { ...g0, x: e.clientX - r.left - g0.w / 2, y: 0 };
      onChange({ max: false, g: g0 });
    }
    drag(e, "move", (dx, dy) =>
      onChange({ g: { ...g0, x: g0.x + dx, y: g0.y + dy } }),
    );
  };

  const onResizeDown = (k: Handle) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const g0 = { ...g };
    const cursor = {
      r: "ew-resize",
      l: "ew-resize",
      b: "ns-resize",
      br: "nwse-resize",
      bl: "nesw-resize",
    }[k];
    drag(e, cursor, (dx, dy) => {
      const n = { ...g0 };
      if (k.includes("r")) n.w = g0.w + dx;
      if (k.includes("b")) n.h = g0.h + dy;
      if (k.includes("l")) {
        const w = Math.max(MIN_W, g0.w - dx);
        n.x = g0.x + (g0.w - w);
        n.w = w;
      }
      onChange({ g: n });
    });
  };

  return (
    <section
      className={[styles.win, focused && styles.winFocus, max && styles.winMax]
        .filter(Boolean)
        .join(" ")}
      style={{
        zIndex: state.z,
        display: state.min ? "none" : undefined,
        ...(max
          ? { left: 0, top: 0, width: "100%", height: "100%" }
          : { left: g.x, top: g.y, width: g.w, height: g.h }),
      }}
      role="dialog"
      aria-label={title}
      onPointerDownCapture={onFocus}
    >
      <div
        className={styles.titlebar}
        onPointerDown={onTitleDown}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest("button") && !phone)
            onChange({ max: !state.max }, true);
        }}
      >
        <AppIcon id={app.id} className={styles.titleIcon} />
        <span className={`${styles.title} kr`}>{title}</span>
        <span className={styles.btns}>
          <button
            type="button"
            title="Свернуть"
            aria-label="Свернуть"
            onClick={onMinimize}
          >
            <OsIcon name="min" />
          </button>
          <button
            type="button"
            className={styles.btnMax}
            title={state.max ? "Восстановить" : "Развернуть"}
            aria-label={state.max ? "Восстановить" : "Развернуть"}
            onClick={() => onChange({ max: !state.max }, true)}
          >
            <OsIcon name={state.max ? "restore" : "max"} />
          </button>
          <button
            type="button"
            className={styles.btnClose}
            title="Закрыть"
            aria-label="Закрыть окно"
            onClick={onClose}
          >
            <OsIcon name="close" />
          </button>
        </span>
      </div>
      <div className={styles.content}>{children}</div>
      {HANDLES.map((k) => (
        <i
          key={k}
          className={`${styles.resize} ${styles[`resize_${k}`]}`}
          onPointerDown={onResizeDown(k)}
        />
      ))}
      {dragging && (
        <div
          className={styles.shield}
          style={{ cursor: `var(--cursor-${dragging}, ${dragging})` }}
        />
      )}
    </section>
  );
}
