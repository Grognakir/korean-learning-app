import type { AppId } from "./apps";

/** Уведомление Solomon OS: баннер сверху и запись в списке под колокольчиком. */
export type OsNote = { id: string; who: string; text: string; app: AppId; at: number; read: boolean };

export const NOTES_KEY = "notifications";
const MAX_NOTES = 30;

export function makeNote(note: Omit<OsNote, "id" | "at" | "read">, now: number): OsNote {
  return { ...note, id: `${now}-${Math.random().toString(36).slice(2, 7)}`, at: now, read: false };
}

export const pushNote = (list: OsNote[], note: OsNote): OsNote[] => [note, ...list].slice(0, MAX_NOTES);

export const unreadNotes = (list: OsNote[]) => list.filter((n) => !n.read).length;

export function markNotesRead(list: OsNote[], ids?: string[]): OsNote[] {
  const hit = (n: OsNote) => !n.read && (!ids || ids.includes(n.id));
  return list.some(hit) ? list.map((n) => (hit(n) ? { ...n, read: true } : n)) : list;
}
