"use client";

import { useEffect, useRef, useState } from "react";
import { OsIcon } from "./icons";
import type { OsNote } from "./notifications";
import styles from "./SolomonOs.module.css";

const SHOW_MS = 6000;

type Offset = { x: number; y: number };

/** Баннер уведомления: нажатие открывает приложение, крестик или смахивание
 * вправо/влево/вверх/вниз убирает (запись остаётся в списке под колокольчиком).
 * Через 6 с уезжает сам. */
export function Toast({
  note,
  avatar,
  onOpen,
  onClose,
}: {
  note: OsNote;
  avatar: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Offset | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const leave = (to: Offset) => {
    setLeaving(to);
    setTimeout(onClose, 220);
  };

  const leaveRef = useRef(leave);
  useEffect(() => {
    leaveRef.current = leave;
  });

  // Не тронули — уезжает вверх сам.
  useEffect(() => {
    if (dragging) return;
    const t = setTimeout(() => leaveRef.current({ x: 0, y: -160 }), SHOW_MS);
    return () => clearTimeout(t);
  }, [dragging]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const x = e.clientX - s.x;
    const y = e.clientY - s.y;
    if (Math.hypot(x, y) > 6) s.moved = true;
    setOffset({ x, y });
  };

  const onUp = () => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (!s) return;
    if (!s.moved) {
      setOffset({ x: 0, y: 0 });
      onOpen();
      return;
    }
    const { x, y } = offset;
    if (x > 70) leave({ x: 420, y });
    else if (x < -70) leave({ x: -420, y });
    else if (y < -30) leave({ x, y: -160 });
    else if (y > 50) leave({ x, y: 220 });
    else setOffset({ x: 0, y: 0 });
  };

  const pos = leaving ?? offset;
  const fade = leaving ? 0 : Math.max(0.25, 1 - Math.hypot(pos.x, pos.y) / 260);

  return (
    <div
      className={`${styles.toast} kr`}
      role="status"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        opacity: fade,
        transition: dragging ? "none" : undefined,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
        if (e.key === "Escape") leave({ x: 0, y: -160 });
      }}
      tabIndex={0}
      aria-label={`${note.who}: ${note.text}`}
    >
      <span className={styles.ava}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.holo} src={avatar} alt="" draggable={false} />
      </span>
      <span className={styles.toastBody}>
        <b>{note.who}</b>
        <small>{note.text}</small>
      </span>
      <button
        type="button"
        className={styles.toastClose}
        aria-label="Закрыть уведомление"
        onClick={() => leave({ x: 420, y: 0 })}
      >
        <OsIcon name="close" />
      </button>
    </div>
  );
}
