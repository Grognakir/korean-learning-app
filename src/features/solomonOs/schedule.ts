/** Расписание повторений тренажёров и журнал звонков (чистые функции).
 *
 * Тренажёр после прохождения получает время следующего повторения: через 1,
 * потом 3, 7 и 14 дней (дальше — каждые 14). Ещё не пройденный тренажёр ждёт
 * повторения сразу. Когда время пришло:
 * - ОС открыта — входящий звонок, звонит минуту; не взял — пропущенный;
 * - время прошло, пока ОС была закрыта, — при входе сразу пропущенный.
 * На один срок (dueAt) — один звонок. */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const INTERVAL_DAYS = [1, 3, 7, 14];
export const RING_MS = 60 * 1000;

export type TrainerState = {
  /** Сколько раз тренажёр пройден. */
  stage: number;
  /** Когда повторять; null — ещё не пройден, повторять сразу. */
  dueAt: number | null;
};

export type ScheduleState = Record<string, TrainerState>;

export type CallKind = "missed" | "incoming" | "outgoing";

export type CallEntry = {
  id: string;
  trainerId: string;
  caller: string;
  kind: CallKind;
  at: number;
  /** Срок повторения, к которому относится звонок (для входящих и пропущенных). */
  dueAt?: number;
  /** Пропущенный уже видели в журнале. */
  seen: boolean;
};

export type Ring = {
  trainerId: string;
  caller: string;
  dueAt: number;
  startedAt: number;
};

export type ScheduledCaller = { id: string; caller: string };

const dueTime = (st: TrainerState | undefined) => st?.dueAt ?? 0;

function entry(
  kind: CallKind,
  t: ScheduledCaller,
  at: number,
  dueAt?: number,
): CallEntry {
  return {
    id: `${kind}-${t.id}-${at}`,
    trainerId: t.id,
    caller: t.caller,
    kind,
    at,
    dueAt,
    seen: kind !== "missed",
  };
}

/** По этому сроку уже был звонок (пропущенный или принятый). */
function handled(log: CallEntry[], trainerId: string, dueAt: number): boolean {
  return log.some(
    (e) =>
      e.trainerId === trainerId && e.dueAt === dueAt && e.kind !== "outgoing",
  );
}

/** Сверка расписания с журналом: при входе в ОС (onOpen) просроченные сроки
 * становятся пропущенными; пока ОС открыта — первый наступивший срок звонит. */
export function reconcile(
  trainers: ScheduledCaller[],
  state: ScheduleState,
  log: CallEntry[],
  now: number,
  opts: { onOpen: boolean; ringing: Ring | null },
): { log: CallEntry[]; ring: Ring | null } {
  let next = log;
  let ring = opts.ringing;
  for (const t of trainers) {
    const dueAt = dueTime(state[t.id]);
    if (dueAt > now || handled(next, t.id, dueAt)) continue;
    if (ring?.trainerId === t.id && ring.dueAt === dueAt) continue;
    if (opts.onOpen) next = [...next, entry("missed", t, now, dueAt)];
    else if (!ring)
      ring = { trainerId: t.id, caller: t.caller, dueAt, startedAt: now };
  }
  return { log: next, ring };
}

/** Итог звонка: ответил — входящий; сбросил или минута без ответа — пропущенный.
 * answered = null — ещё звонит (проверка по времени). */
export function resolveRing(
  log: CallEntry[],
  ring: Ring,
  now: number,
  answered: boolean | null,
): { log: CallEntry[]; ring: Ring | null } {
  const t = { id: ring.trainerId, caller: ring.caller };
  if (answered === true)
    return { log: [...log, entry("incoming", t, now, ring.dueAt)], ring: null };
  if (answered === false || now - ring.startedAt >= RING_MS) {
    return { log: [...log, entry("missed", t, now, ring.dueAt)], ring: null };
  }
  return { log, ring };
}

/** Перезвонить: исходящий звонок в журнал. */
export function addOutgoing(
  log: CallEntry[],
  t: ScheduledCaller,
  now: number,
): CallEntry[] {
  return [...log, entry("outgoing", t, now)];
}

/** Тренажёр пройден — следующее повторение через 1 → 3 → 7 → 14 дней. */
export function afterPass(
  state: ScheduleState,
  trainerId: string,
  now: number,
): ScheduleState {
  const st = state[trainerId] ?? { stage: 0, dueAt: null };
  const days = INTERVAL_DAYS[Math.min(st.stage, INTERVAL_DAYS.length - 1)];
  return {
    ...state,
    [trainerId]: { stage: st.stage + 1, dueAt: now + days * DAY_MS },
  };
}

/** Счётчик на иконке 전화: непросмотренные пропущенные. */
export function unseenMissed(log: CallEntry[]): number {
  return log.filter((e) => e.kind === "missed" && !e.seen).length;
}

export function markSeen(log: CallEntry[]): CallEntry[] {
  return log.some((e) => !e.seen)
    ? log.map((e) => (e.seen ? e : { ...e, seen: true }))
    : log;
}
