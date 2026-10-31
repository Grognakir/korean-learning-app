/** Календарь 달력: даты встреч из заданий, повторения тренажёров, сетка
 * месяца (чистые функции, местное время). */

import type { MissionNote } from "./missions";
import type { ScheduleState } from "./schedule";
import type { AppId } from "./apps";

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** Чхусок (15-е число 8-го лунного месяца) — по таблице. */
const CHUSEOK = ["2026-09-25", "2027-09-15", "2028-10-03", "2029-09-22", "2030-09-12"];

const startOfDay = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const addDays = (day: number, n: number) => {
  const d = new Date(day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
};

const hhmm = (t: number) => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** Дата встречи по строке эпизода («토요일 11:30», «다음 날 09:30»,
 * «다음 주 토요일 08:00», «추석 아침»…) от момента выдачи задания. */
export function meetingDate(
  place: string,
  from: number,
): { at: number; time: string } {
  const day = startOfDay(from);
  const dow = new Date(day).getDay();
  const hm = place.match(/(\d{1,2}):(\d{2})/);
  let target = day;

  const weekday = place.match(/([일월화수목금토])요일/);
  if (/추석/.test(place)) {
    const next = CHUSEOK.map((s) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d).getTime();
    }).find((t) => t >= day);
    if (next) target = next;
  } else if (weekday) {
    const w = WEEKDAYS.indexOf(weekday[1]);
    if (/다음\s*주/.test(place)) {
      // Неделя с понедельника: «다음 주» — следующая такая неделя.
      const monday = addDays(day, -((dow + 6) % 7));
      target = addDays(monday, 7 + ((w + 6) % 7));
    } else {
      target = addDays(day, (w - dow + 7) % 7);
    }
  } else if (/내일|다음\s*날/.test(place)) {
    target = addDays(day, 1);
  }

  const time = hm
    ? `${hm[1].padStart(2, "0")}:${hm[2]}`
    : place.replace(/추석|다음\s*(주|날)|[일월화수목금토]요일|내일|오늘/g, "").trim();
  const at = hm
    ? target + (Number(hm[1]) * 60 + Number(hm[2])) * 60 * 1000
    : target + 9 * 60 * 60 * 1000;
  return { at, time };
}

export type CalDay = { at: number; day: number; inMonth: boolean };

/** Сетка месяца: 6 недель с воскресенья. */
export function monthGrid(year: number, month: number): CalDay[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { at: d.getTime(), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

export type CalEvent = {
  id: string;
  at: number;
  /** «11:30» или слово («저녁»), пусто — без времени. */
  time: string;
  title: string;
  /** Подпись по-корейски: место встречи или вид события. */
  ko: string;
  kind: "meeting" | "route" | "repeat";
  done: boolean;
  noteId?: string;
  app: AppId;
};

export function calendarEvents({
  notes,
  schedule,
  trainers,
  now,
}: {
  notes: MissionNote[];
  schedule: ScheduleState;
  trainers: { id: string; caller: string }[];
  now: number;
}): CalEvent[] {
  const events: CalEvent[] = [];
  for (const n of notes) {
    if (n.kind === "shopping" && n.eventAt != null)
      events.push({
        id: `meeting-${n.id}`,
        at: n.eventAt,
        time: n.eventTime ?? "",
        title: n.title,
        ko: n.eventPlace ?? "약속",
        kind: "meeting",
        done: n.completed,
        noteId: n.id,
        app: "notes",
      });
    if (n.kind === "route")
      events.push({
        id: `route-${n.id}`,
        at: n.at,
        time: "",
        title: n.title,
        ko: n.ko,
        kind: "route",
        done: n.completed,
        noteId: n.id,
        app: "notes",
      });
  }
  for (const t of trainers) {
    const due = schedule[t.id]?.dueAt ?? now;
    events.push({
      id: `repeat-${t.id}-${due}`,
      at: due,
      time: hhmm(due),
      title: `Повторение · ${t.caller}`,
      ko: `${t.caller} 전화`,
      kind: "repeat",
      done: false,
      app: "call",
    });
  }
  return events.sort((a, b) => a.at - b.at);
}

export const isSameDay = (a: number, b: number) =>
  startOfDay(a) === startOfDay(b);
