"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { APPS, type AppId } from "./apps";
import { AppIcon, OsIcon } from "./icons";
import {
  attach,
  colX,
  compute,
  defaultModel,
  detach,
  gridGeometry,
  modelHasAll,
  rowY,
  snap,
  type GridModel,
} from "./iconGrid";
import { load, save } from "./store";
import styles from "./SolomonOs.module.css";

const MODEL_KEY = "icons3";
const IDS = APPS.map((a) => a.id);

type Drag = { id: AppId; x: number; y: number; moved: boolean };

/** Рабочий стол: иконки на общей сетке, перетаскивание с подсказкой клетки,
 * раскладка пересчитывается при каждом изменении размера. Окна и
 * уведомления — дети (поверх иконок). */
export function Desktop({
  phone,
  badges,
  onOpen,
  onSize,
  children,
}: {
  phone: boolean;
  badges: Partial<Record<AppId, number>>;
  onOpen: (id: AppId) => void;
  onSize?: (size: { w: number; h: number }) => void;
  children?: ReactNode;
}) {
  const deskRef = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [saved, setSaved] = useState<GridModel | null>(() =>
    load<GridModel | null>(MODEL_KEY, null),
  );
  const [selected, setSelected] = useState<AppId | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [settle, setSettle] = useState(false);
  const start = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const lastTap = useRef<{ id: AppId; at: number } | null>(null);

  const [cw, ch] = phone ? [84, 92] : [92, 96];
  const geo = useMemo(
    () => gridGeometry(size.w, size.h, cw, ch),
    [size, cw, ch],
  );
  const model = useMemo(
    () => (modelHasAll(saved, IDS) ? saved : defaultModel(IDS, geo.rows)),
    [saved, geo.rows],
  );
  const places = useMemo(() => compute(model, geo), [model, geo]);

  useLayoutEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    const measure = () =>
      setSize({ w: desk.clientWidth, h: desk.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(desk);
    return () => ro.disconnect();
  }, []);

  useEffect(() => onSize?.(size), [size, onSize]);

  useEffect(() => {
    if (!settle) return;
    const t = setTimeout(() => setSettle(false), 200);
    return () => clearTimeout(t);
  }, [settle]);

  const point = (e: React.PointerEvent) => {
    const d = deskRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - d.left - start.current!.ox,
      y: e.clientY - d.top - start.current!.oy,
    };
  };

  const onDown = (id: AppId) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelected(id);
    const r = e.currentTarget.getBoundingClientRect();
    start.current = {
      x: e.clientX,
      y: e.clientY,
      ox: e.clientX - r.left,
      oy: e.clientY - r.top,
    };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // указатель уже отпущен — перетаскивание просто не начнётся
    }
  };

  const onMove = (id: AppId) => (e: React.PointerEvent) => {
    if (!start.current) return;
    if (
      !drag &&
      Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) < 6
    )
      return;
    setDrag({ id, moved: true, ...point(e) });
  };

  const onUp = (id: AppId) => (e: React.PointerEvent) => {
    if (!start.current) return;
    if (drag) {
      const [c, r] = snap(point(e).x, point(e).y, geo);
      const next = attach(detach(model, id), id, c, r, geo);
      setSaved(next);
      save(MODEL_KEY, next);
      setSettle(true);
    } else {
      // компьютер: двойной клик; телефон и касание: одно нажатие
      const now = Date.now();
      const double =
        lastTap.current?.id === id && now - lastTap.current.at < 400;
      if (phone || e.pointerType === "touch" || double) onOpen(id);
      lastTap.current = { id, at: now };
    }
    start.current = null;
    setDrag(null);
  };

  const hint = drag ? snap(drag.x, drag.y, geo) : null;

  return (
    <main
      ref={deskRef}
      className={styles.desk}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelected(null);
      }}
    >
      <div className={styles.seal}>
        <OsIcon name="seal" />
      </div>
      {hint && (
        <div
          className={styles.gridHint}
          style={{
            left: colX(geo, hint[0]),
            top: rowY(geo, hint[1]),
            width: cw,
            height: ch,
          }}
        />
      )}
      {APPS.map((a) => {
        const p = places[a.id];
        if (!p) return null;
        const dragging = drag?.id === a.id;
        const badge = badges[a.id] ?? 0;
        return (
          <button
            key={a.id}
            type="button"
            className={[
              styles.icon,
              "kr",
              a.locked && styles.iconLocked,
              selected === a.id && styles.iconSel,
              settle && styles.settle,
              dragging && styles.dragging,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              left: dragging ? drag.x : p.x,
              top: dragging ? drag.y : p.y,
              width: cw,
              height: ch,
            }}
            aria-label={`${a.ko} — ${a.ru}${a.locked ? " (закрыто)" : ""}${badge ? `, ${badge}` : ""}`}
            onPointerDown={onDown(a.id)}
            onPointerMove={onMove(a.id)}
            onPointerUp={onUp(a.id)}
            onPointerCancel={() => {
              start.current = null;
              setDrag(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onOpen(a.id);
            }}
          >
            <span className={styles.pic}>
              <AppIcon id={a.id} />
              {a.locked && <i className={styles.lock}>🔒</i>}
              {badge > 0 && <b className={styles.badge}>{badge}</b>}
            </span>
            <span className={styles.iconLabel}>{a.ko}</span>
          </button>
        );
      })}
      {children}
    </main>
  );
}
