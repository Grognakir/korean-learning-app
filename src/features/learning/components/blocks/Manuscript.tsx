"use client";

import { useRef, useState } from "react";
import { layoutManuscript, MANUSCRIPT_COLS, type ManuscriptCell } from "./manuscriptGrid";
import styles from "./blocks.module.css";

// Каждая 5-я строка (100 клеток) подписана числом-ориентиром — как на
// настоящем бланке 원고지, независимо от того, что уже написано.
const ROW_NUMBER_EVERY = 5;

// 원고지: видимая сетка — только раскладка текста из textarea, сам textarea
// невидим и растянут поверх сетки, чтобы клик в любую клетку фокусировал
// его и печать (включая композицию хангыля через IME) шла как обычный ввод,
// а не посимвольно по отдельным полям — иначе IME ломается при переключении
// фокуса между клетками на каждый слог. Клик по клетке ставит курсор
// textarea ровно на её caretIndex (см. manuscriptGrid.ts) — так можно
// править текст в середине, а не только дописывать в конец.
export function Manuscript({ rows: minRows = 20 }: { rows?: number }) {
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const grid = layoutManuscript(value, MANUSCRIPT_COLS);
  while (grid.length < minRows) {
    grid.push(
      Array.from({ length: MANUSCRIPT_COLS }, () => ({ char: "", caretIndex: value.length })),
    );
  }

  const syncCaret = () => {
    const el = textareaRef.current;
    if (el) setCaret(el.selectionStart ?? 0);
  };

  const handleCellClick = (cell: ManuscriptCell) => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(cell.caretIndex, cell.caretIndex);
    setCaret(cell.caretIndex);
  };

  return (
    <div className={styles.manuscriptWrap}>
      <textarea
        ref={textareaRef}
        className={styles.manuscriptInput}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={syncCaret}
        onKeyUp={syncCaret}
        onSelect={syncCaret}
        aria-label="Текст сочинения"
      />
      <div className={styles.manuscriptGrid} aria-hidden="true">
        {grid.map((row, i) => (
          <div key={i} className={styles.manuscriptRow}>
            {row.map((cell, j) => (
              <span
                key={j}
                className={`kr ${styles.manuscriptCell} ${
                  cell.caretIndex === caret ? styles.manuscriptCellActive : ""
                }`}
                onClick={() => handleCellClick(cell)}
              >
                {cell.char}
              </span>
            ))}
            {(i + 1) % ROW_NUMBER_EVERY === 0 && (
              <span className={styles.manuscriptRowNumber}>{(i + 1) * MANUSCRIPT_COLS}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
