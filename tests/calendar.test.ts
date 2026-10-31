import { describe, expect, it } from "vitest";
import { calendarEvents, meetingDate, monthGrid } from "@/features/solomonOs/calendar";

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
// 2026-11-04 — среда.
const WED = at(2026, 11, 4, 15);

describe("календарь: дата встречи из строки эпизода", () => {
  it("день недели — ближайший, сегодняшний подходит", () => {
    expect(meetingDate("토요일 11:30", WED)).toEqual({ at: at(2026, 11, 7, 11, 30), time: "11:30" });
    expect(meetingDate("수요일 18:00", WED).at).toBe(at(2026, 11, 4, 18));
    expect(meetingDate("금요일 저녁", WED)).toEqual({ at: at(2026, 11, 6, 9), time: "저녁" });
  });

  it("다음 주 — тот же день на следующей неделе (с понедельника)", () => {
    expect(meetingDate("다음 주 토요일 08:00", WED).at).toBe(at(2026, 11, 14, 8));
    // Из воскресенья 8.11 «다음 주 토요일» — 14.11.
    expect(meetingDate("다음 주 토요일 08:00", at(2026, 11, 8, 10)).at).toBe(at(2026, 11, 14, 8));
  });

  it("오늘, 다음 날, без дня и 추석", () => {
    expect(meetingDate("오늘 19:00", WED).at).toBe(at(2026, 11, 4, 19));
    expect(meetingDate("저녁 19:00", WED).at).toBe(at(2026, 11, 4, 19));
    expect(meetingDate("다음 날 09:30", WED).at).toBe(at(2026, 11, 5, 9, 30));
    expect(meetingDate("추석 아침", WED)).toEqual({ at: at(2027, 9, 15, 9), time: "아침" });
  });
});

describe("календарь: сетка и события", () => {
  it("ноябрь 2026 — с воскресенья 1.11, 6 недель", () => {
    const g = monthGrid(2026, 10);
    expect(g).toHaveLength(42);
    expect(new Date(g[0].at).getDate()).toBe(1);
    expect(g.filter((d) => d.inMonth)).toHaveLength(30);
    expect(g[41].inMonth).toBe(false);
  });

  it("встречи из заметок и повторения тренажёров", () => {
    const base = { ko: "", brief: "", said: [], at: WED, steps: [], rules: [], app: "shop" as const };
    const events = calendarEvents({
      notes: [
        { ...base, id: "s1", kind: "shopping", title: "Собеседование 지아", completed: false, eventAt: at(2026, 11, 5, 8, 30), eventTime: "08:30", eventPlace: "지아 집 앞" },
        // Старая запись архива без даты — в календарь не попадает.
        { ...base, id: "old", kind: "shopping", title: "Старое", completed: true },
      ],
      schedule: { t1: { stage: 1, dueAt: at(2026, 11, 6, 10) } },
      trainers: [{ id: "t1", caller: "지아" }],
      now: WED,
    });
    expect(events.map((e) => [e.kind, e.title, e.noteId ?? e.app])).toEqual([
      ["meeting", "Собеседование 지아", "s1"],
      ["repeat", "Повторение · 지아", "call"],
    ]);
  });
});
