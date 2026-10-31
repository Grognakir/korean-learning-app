"use client";

import { useState } from "react";
import { useOsStore } from "../OsStorage";
import type { MissionNote } from "../missions";
import styles from "./Notes.module.css";

export const NOTE_STYLES = [
  {
    id: "paper",
    name: "Список и заметка",
    detail: "Привычная компоновка заметок в оформлении Solomon OS",
  },
  {
    id: "checklist",
    name: "Чек-лист",
    detail: "Крупные задачи, статусы и оставшиеся шаги",
  },
  { id: "cards", name: "Карточки", detail: "Все задания на одной доске" },
  {
    id: "journal",
    name: "Журнал",
    detail: "Вертикальный алгоритм и история выполнения",
  },
] as const;
export type NoteStyle = (typeof NOTE_STYLES)[number]["id"];

export function Notes({
  notes,
  onOpen,
  initialStyle,
}: {
  notes: MissionNote[];
  onOpen: (note: MissionNote) => void;
  initialStyle?: NoteStyle;
}) {
  const store = useOsStore();
  const [style] = useState<NoteStyle>(
    () => initialStyle ?? store.load("noteStyle", "paper"),
  );
  const [selected, setSelected] = useState<string>();
  const [inNote, setInNote] = useState(false);
  const [ru, setRu] = useState(false);
  const shown = [...notes].sort(
    (a, b) => Number(a.completed) - Number(b.completed) || b.at - a.at,
  );
  const note = shown.find((n) => n.id === selected) ?? shown[0];
  return (
    <div className={styles.notes} data-note-style={style} data-in-note={inNote}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.noteList}>
            {shown.map((n) => (
              <button
                type="button"
                key={n.id}
                className={note?.id === n.id ? styles.selected : undefined}
                data-done={n.completed}
                onClick={() => {
                  setSelected(n.id);
                  setInNote(true);
                }}
              >
                <b>{n.title}</b>
                <small>{n.kind === "shopping" ? "Покупки" : "Маршрут"}</small>
              </button>
            ))}
          </div>
          {!shown.length && <p className={styles.empty}>Заметок пока нет.</p>}
        </aside>
        {note && (
          <article className={styles.note} key={note.id}>
            <button
              type="button"
              className={styles.back}
              onClick={() => setInNote(false)}
            >
              ‹ Заметки
            </button>
            <header className={styles.title}>
              <h3>{note.title}</h3>
              {!note.completed && (
                <button
                  type="button"
                  className={styles.go}
                  aria-label={
                    note.app === "map"
                      ? "Открыть маршрут"
                      : "Продолжить покупки"
                  }
                  onClick={() => onOpen(note)}
                >
                  →
                </button>
              )}
            </header>
            {note.said.length > 0 && (
              <div className={styles.said}>
                {note.said.map((l, i) => (
                  <p key={i}>
                    <span className="kr">{l.ko}</span>
                    {ru && l.ru && <small>{l.ru}</small>}
                  </p>
                ))}
                {note.said.some((l) => l.ru) && (
                  <button
                    type="button"
                    className={styles.ru}
                    aria-pressed={ru}
                    onClick={() => setRu((v) => !v)}
                  >
                    RU
                  </button>
                )}
              </div>
            )}
            <ul className={styles.steps}>
              {note.steps.map((s) => (
                <li key={s.id} data-status={s.status}>
                  <span
                    className={styles.check}
                    role="img"
                    aria-label={
                      s.status === "done" ? "Выполнено" : "Не выполнено"
                    }
                  >
                    {s.status === "done" ? "✓" : ""}
                  </span>
                  <span className="kr">{s.text}</span>
                </li>
              ))}
            </ul>
          </article>
        )}
      </div>
    </div>
  );
}
