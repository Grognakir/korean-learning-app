"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { layoutManuscript, MANUSCRIPT_COLS, type ManuscriptCell } from "./manuscriptGrid";
import styles from "./blocks.module.css";

const MOBILE_MANUSCRIPT_COLS = 10;
const MOBILE_MANUSCRIPT_QUERY = "(max-width: 600px)";
const ROW_NUMBER_EVERY_CELLS = 100;

// 원고지: видимая сетка — только раскладка текста из textarea, сам textarea
// невидим и растянут поверх сетки, чтобы клик в любую клетку фокусировал
// его и печать (включая композицию хангыля через IME) шла как обычный ввод,
// а не посимвольно по отдельным полям — иначе IME ломается при переключении
// фокуса между клетками на каждый слог. Клик по клетке ставит курсор
// textarea сразу после её содержимого (см. manuscriptGrid.ts), поэтому
// Backspace удаляет символ выбранной клетки.
export function Manuscript({ rows: minRows = 20 }: { rows?: number }) {
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [columns, setColumns] = useState(MANUSCRIPT_COLS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(MOBILE_MANUSCRIPT_QUERY);
    const syncColumns = () => {
      setColumns(media.matches ? MOBILE_MANUSCRIPT_COLS : MANUSCRIPT_COLS);
    };

    syncColumns();
    media.addEventListener("change", syncColumns);
    return () => media.removeEventListener("change", syncColumns);
  }, []);

  const minimumCells = minRows * MANUSCRIPT_COLS;
  const minimumRows = Math.ceil(minimumCells / columns);
  const grid = layoutManuscript(value, columns);
  while (grid.length < minimumRows) {
    grid.push(
      Array.from({ length: columns }, () => ({
        char: "",
        caretIndex: value.length,
        caretAfterIndex: value.length,
      })),
    );
  }

  const activeCell = (() => {
    if (!isFocused) return null;

    if (value.length === 0 && caret === 0) return { row: 0, column: 1 };

    for (let row = 0; row < grid.length; row++) {
      for (let column = 0; column < grid[row].length; column++) {
        const cell = grid[row][column];
        if (cell.char !== "" && cell.caretAfterIndex === caret) {
          return { row, column };
        }
      }
    }

    for (let row = 0; row < grid.length; row++) {
      for (let column = 0; column < grid[row].length; column++) {
        const cell = grid[row][column];
        if (cell.char === "" && cell.caretIndex === caret) return { row, column };
      }
    }

    return null;
  })();

  const syncCaret = () => {
    const el = textareaRef.current;
    if (el) setCaret(el.selectionStart ?? 0);
  };

  const handleCellClick = (cell: ManuscriptCell) => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(cell.caretAfterIndex, cell.caretAfterIndex);
    setCaret(cell.caretAfterIndex);
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
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Текст сочинения"
      />
      <div
        className={styles.manuscriptGrid}
        style={{ "--manuscript-columns": columns } as CSSProperties}
        aria-hidden="true"
      >
        {grid.map((row, i) => (
          <div key={i} className={styles.manuscriptRow}>
            {row.map((cell, j) => (
              <span
                key={j}
                className={`kr ${styles.manuscriptCell} ${
                  activeCell?.row === i && activeCell.column === j
                    ? styles.manuscriptCellActive
                    : ""
                }`}
                onClick={() => handleCellClick(cell)}
              >
                {cell.char}
              </span>
            ))}
            {((i + 1) * columns) % ROW_NUMBER_EVERY_CELLS === 0 && (
              <span className={styles.manuscriptRowNumber}>{(i + 1) * columns}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
