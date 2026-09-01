"use client";

import { useCallback, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { updateNewCardsLimit } from "../actions";
import styles from "./NewCardsSlider.module.css";

const MIN = 5;
const MAX = 50;
const TICK_STEP = 5;
// Магнит срабатывает только совсем рядом с точкой фиксации (в единицах
// значения, не округлённых) — иначе он проглатывает и соседние целые
// числа (6, 9, 11, 14...), которые должны выбираться свободно.
const SNAP_RADIUS = 0.5;

const TICKS = Array.from(
  { length: (MAX - MIN) / TICK_STEP + 1 },
  (_, i) => MIN + i * TICK_STEP,
);

function clamp(n: number) {
  return Math.min(MAX, Math.max(MIN, Math.round(n)));
}

// n — непрерывное (не округлённое) значение с позиции указателя.
function applySnap(n: number) {
  const nearestTick = Math.round(n / TICK_STEP) * TICK_STEP;
  return Math.abs(n - nearestTick) <= SNAP_RADIUS ? nearestTick : clamp(n);
}

export function NewCardsSlider({ initialValue }: { initialValue: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const [value, setValue] = useState(() => clamp(initialValue));

  const commit = useCallback((n: number) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void updateNewCardsLimit(n).then((result) => {
        if (result && "error" in result && result.error) {
          console.error(result.error);
        }
      });
    }, 200);
  }, []);

  const valueFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = Math.min(MAX, Math.max(MIN, MIN + ratio * (MAX - MIN)));
    return applySnap(raw);
  }, [value]);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    trackRef.current?.setPointerCapture(e.pointerId);
    const next = valueFromClientX(e.clientX);
    setValue(next);
    commit(next);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const next = valueFromClientX(e.clientX);
    setValue(next);
    commit(next);
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let next = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clamp(value + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clamp(value - 1);
    else return;
    e.preventDefault();
    setValue(next);
    commit(next);
  }

  const percent = ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <span className={styles.label}>Новых карт за сессию</span>
        <span className={styles.value}>{value}</span>
      </div>
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        tabIndex={0}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
        aria-label="Новых карт за сессию"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
        {TICKS.map((t) => (
          <span
            key={t}
            className={styles.tick}
            style={{ left: `${((t - MIN) / (MAX - MIN)) * 100}%` }}
          />
        ))}
        <div className={styles.thumb} style={{ left: `${percent}%` }} />
      </div>
    </div>
  );
}
