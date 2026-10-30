import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addOutgoing,
  afterPass,
  DAY_MS,
  markSeen,
  reconcile,
  resolveRing,
  RING_MS,
  unseenMissed,
  type CallEntry,
  type ScheduleState,
} from "@/features/solomonOs/schedule";
import { load, save } from "@/features/solomonOs/store";

const JIA = { id: "lesson10-clothes", caller: "지아" };
const T0 = Date.UTC(2026, 9, 31, 6, 0);

describe("расписание звонков Solomon OS", () => {
  afterEach(() => vi.restoreAllMocks());

  it("непройденный тренажёр при входе в ОС — сразу пропущенный, повторно не добавляется", () => {
    const first = reconcile([JIA], {}, [], T0, { onOpen: true, ringing: null });
    expect(first.ring).toBeNull();
    expect(first.log).toHaveLength(1);
    expect(first.log[0]).toMatchObject({ kind: "missed", caller: "지아", seen: false, dueAt: 0 });
    expect(unseenMissed(first.log)).toBe(1);
    const again = reconcile([JIA], {}, first.log, T0 + 1000, { onOpen: true, ringing: null });
    expect(again.log).toHaveLength(1);
    const open = reconcile([JIA], {}, first.log, T0 + 2000, { onOpen: false, ringing: null });
    expect(open.ring).toBeNull();
  });

  it("время пришло при открытой ОС — входящий звонок; минута без ответа — пропущенный", () => {
    const state: ScheduleState = { [JIA.id]: { stage: 1, dueAt: T0 + 5000 } };
    expect(reconcile([JIA], state, [], T0, { onOpen: false, ringing: null }).ring).toBeNull();
    const { ring, log } = reconcile([JIA], state, [], T0 + 5000, { onOpen: false, ringing: null });
    expect(ring).toMatchObject({ trainerId: JIA.id, dueAt: T0 + 5000, startedAt: T0 + 5000 });
    // ещё звонит
    expect(resolveRing(log, ring!, T0 + 5000 + RING_MS - 1, null).ring).not.toBeNull();
    // повторная сверка не создаёт второй звонок
    expect(reconcile([JIA], state, log, T0 + 6000, { onOpen: false, ringing: ring }).ring).toBe(ring);
    const missed = resolveRing(log, ring!, T0 + 5000 + RING_MS, null);
    expect(missed.ring).toBeNull();
    expect(missed.log.map((e) => e.kind)).toEqual(["missed"]);
    expect(unseenMissed(missed.log)).toBe(1);
  });

  it("ответил — входящий; сбросил — пропущенный", () => {
    const ring = { trainerId: JIA.id, caller: "지아", dueAt: T0, startedAt: T0 };
    expect(resolveRing([], ring, T0 + 1000, true).log[0]).toMatchObject({ kind: "incoming", seen: true });
    expect(resolveRing([], ring, T0 + 1000, false).log[0]).toMatchObject({ kind: "missed", seen: false });
  });

  it("повторения: 1 → 3 → 7 → 14 → 14 дней", () => {
    let state: ScheduleState = {};
    const gaps: number[] = [];
    for (let i = 0; i < 5; i++) {
      state = afterPass(state, JIA.id, T0);
      gaps.push((state[JIA.id].dueAt! - T0) / DAY_MS);
    }
    expect(gaps).toEqual([1, 3, 7, 14, 14]);
    expect(state[JIA.id].stage).toBe(5);
  });

  it("после повторения срок новый — снова звонок; исходящий не считается звонком по сроку", () => {
    let log: CallEntry[] = reconcile([JIA], {}, [], T0, { onOpen: true, ringing: null }).log;
    log = addOutgoing(log, JIA, T0 + 10);
    const state = afterPass({}, JIA.id, T0 + 20);
    const later = T0 + 20 + DAY_MS;
    const r = reconcile([JIA], state, log, later, { onOpen: true, ringing: null });
    expect(r.log.map((e) => e.kind)).toEqual(["missed", "outgoing", "missed"]);
    expect(unseenMissed(markSeen(r.log))).toBe(0);
  });

  it("хранилище недоступно — состояние живёт в памяти", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    save("test-key", { a: 1 });
    expect(load("test-key", null)).toEqual({ a: 1 });
    expect(load("missing-key", "fallback")).toBe("fallback");
  });
});
