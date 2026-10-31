"use client";

import { useState } from "react";
import {
  WEEKDAYS,
  dayKey,
  isSameDay,
  monthGrid,
  type CalEvent,
} from "../calendar";
import styles from "./Calendar.module.css";

const KIND_KO: Record<CalEvent["kind"], string> = {
  meeting: "약속",
  route: "길 찾기",
  repeat: "복습",
};

/** 달력: месяц сеткой, как календарь на iPhone/Mac. Встречи из заданий и
 * повторения появляются сами; нажатие на событие открывает его заметку
 * (или 전화 для повторения). */
export function Calendar({
  events,
  now,
  onOpen,
}: {
  events: CalEvent[];
  now: number;
  onOpen: (event: CalEvent) => void;
}) {
  const [view, setView] = useState(() => {
    const d = new Date(now);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(now);

  const byDay = new Map<string, CalEvent[]>();
  for (const e of events) {
    const k = dayKey(e.at);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  const days = monthGrid(view.y, view.m);
  const dayEvents = byDay.get(dayKey(selected)) ?? [];

  const shift = (n: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const today = () => {
    const d = new Date(now);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(now);
  };

  const sel = new Date(selected);

  return (
    <div
      className={`${styles.cal} kr`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") shift(-1);
        if (e.key === "ArrowRight") shift(1);
      }}
    >
      <div className={styles.layout}>
      <div className={styles.main}>
        <header className={styles.head}>
          <h3>
            {view.y}년 <b>{view.m + 1}월</b>
          </h3>
          <div className={styles.nav}>
            <button type="button" aria-label="Предыдущий месяц" onClick={() => shift(-1)}>
              ‹
            </button>
            <button type="button" className={styles.today} onClick={today}>
              오늘
            </button>
            <button type="button" aria-label="Следующий месяц" onClick={() => shift(1)}>
              ›
            </button>
          </div>
        </header>
        <div className={styles.weekdays} aria-hidden>
          {WEEKDAYS.map((w, i) => (
            <span key={w} data-dow={i}>
              {w}
            </span>
          ))}
        </div>
        <div className={styles.grid} role="grid" aria-label={`${view.y}년 ${view.m + 1}월`}>
          {days.map((d, i) => {
            const list = byDay.get(dayKey(d.at)) ?? [];
            return (
              <div
                key={d.at}
                role="gridcell"
                aria-selected={isSameDay(d.at, selected)}
                className={styles.cell}
                data-out={!d.inMonth}
                data-dow={i % 7}
                onClick={() => {
                  setSelected(d.at);
                  if (!d.inMonth) setView({ y: new Date(d.at).getFullYear(), m: new Date(d.at).getMonth() });
                }}
              >
                <span
                  className={styles.num}
                  data-today={isSameDay(d.at, now)}
                  aria-label={`${new Date(d.at).getMonth() + 1}월 ${d.day}일`}
                >
                  {d.day}
                </span>
                <div className={styles.chips}>
                  {list.slice(0, 2).map((e) => (
                    <button
                      type="button"
                      key={e.id}
                      className={styles.chip}
                      data-kind={e.kind}
                      data-done={e.done}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onOpen(e);
                      }}
                    >
                      {e.done && "✓ "}
                      {e.time && /\d/.test(e.time) && <time>{e.time}</time>} {e.title}
                    </button>
                  ))}
                  {list.length > 2 && <small>+{list.length - 2}</small>}
                </div>
                {list.length > 0 && (
                  <div className={styles.dots} aria-hidden>
                    {list.slice(0, 3).map((e) => (
                      <i key={e.id} data-kind={e.kind} data-done={e.done} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <aside className={styles.side} aria-label="События дня">
        <h4>
          {sel.getMonth() + 1}월 {sel.getDate()}일 <span>{WEEKDAYS[sel.getDay()]}요일</span>
        </h4>
        {dayEvents.length ? (
          <ul>
            {dayEvents.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={styles.event}
                  title={`${e.title} · ${e.ko}`}
                  data-kind={e.kind}
                  data-done={e.done}
                  onClick={() => onOpen(e)}
                >
                  <span className={styles.eventTime}>{e.time || "—"}</span>
                  <span className={styles.eventBody}>
                    <b>{e.title}</b>
                    <small>
                      {KIND_KO[e.kind]} · {e.ko}
                      {e.done && " · ✓ 완료"}
                    </small>
                  </span>
                  <span className={styles.arrow} aria-hidden>
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>일정이 없어요</p>
        )}
      </aside>
      </div>
    </div>
  );
}
