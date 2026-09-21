"use client";

import { useCallback, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { updateNewCardsLimit } from "../actions";
import styles from "./NewCardsSlider.module.css";

const MIN = 5;
const DEFAULT_MAX = 50;
const TICK_STEP = 5;
// Магнит срабатывает только совсем рядом с точкой фиксации (в единицах
// значения, не округлённых) — иначе он проглатывает и соседние целые
// числа (6, 9, 11, 14...), которые должны выбираться свободно.
const SNAP_RADIUS = 0.5;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

// n — непрерывное (не округлённое) значение с позиции указателя.
function applySnap(n: number, min: number, max: number) {
  const nearestTick = Math.round(n / TICK_STEP) * TICK_STEP;
  return Math.abs(n - nearestTick) <= SNAP_RADIUS
    ? clamp(nearestTick, min, max)
    : clamp(n, min, max);
}

export function NewCardsSlider({
  initialValue,
  availableCount,
}: {
  initialValue: number;
  availableCount?: number;
}) {
  const max = availableCount === undefined
    ? DEFAULT_MAX
    : Math.min(DEFAULT_MAX, Math.max(0, availableCount));
  const min = max < MIN ? max : MIN;
  const trackRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const [value, setValue] = useState(() => clamp(initialValue, min, max));

  const ticks = useMemo(() => {
    if (max < MIN) return [];
    return Array.from(
      { length: Math.floor((max - MIN) / TICK_STEP) + 1 },
      (_, i) => MIN + i * TICK_STEP,
    );
  }, [max]);

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
    if (max === min) return max;
    const el = trackRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return applySnap(raw, min, max);
  }, [max, min, value]);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (max === min) return;
    draggingRef.current = true;
    trackRef.current?.setPointerCapture(e.pointerId);
    const next = valueFromClientX(e.clientX);
    setValue(next);
    commit(next);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || max === min) return;
    const next = valueFromClientX(e.clientX);
    setValue(next);
    commit(next);
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (max === min) return;
    let next = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clamp(value + 1, min, max);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clamp(value - 1, min, max);
    else return;
    e.preventDefault();
    setValue(next);
    commit(next);
  }

  const percent = max === min ? (max === 0 ? 0 : 100) : ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <span className={styles.label}>Новых карт за сессию</span>
        <span className={styles.value}>{value}</span>
      </div>
      {availableCount !== undefined && (
        <p className={styles.available}>Доступно новых: {availableCount}</p>
      )}
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        tabIndex={max === 0 ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={max === 0}
        aria-label="Новых карт за сессию"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
        {ticks.map((t) => (
          <span
            key={t}
            className={styles.tick}
            style={{ left: `${max === min ? 100 : ((t - min) / (max - min)) * 100}%` }}
          />
        ))}
        <div className={styles.thumb} style={{ left: `${percent}%` }} />
      </div>
    </div>
  );
}
