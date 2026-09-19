"use client";

import { useRef, useState } from "react";
import { layoutManuscript, MANUSCRIPT_COLS } from "./manuscriptGrid";
import styles from "./blocks.module.css";

// 원고지: видимая сетка — только раскладка текста из textarea, сам textarea
// невидим и растянут поверх сетки, чтобы клик в любую клетку фокусировал
// его и печать (включая композицию хангыля через IME) шла как обычный ввод,
// а не посимвольно по отдельным полям — иначе IME ломается при переключении
// фокуса между клетками на каждый слог.
export function Manuscript({ rows: minRows = 15 }: { rows?: number }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const grid = layoutManuscript(value, MANUSCRIPT_COLS);
  while (grid.length < minRows) grid.push(Array(MANUSCRIPT_COLS).fill(""));

  return (
    <div
      className={styles.manuscriptWrap}
      onClick={() => textareaRef.current?.focus()}
    >
      <textarea
        ref={textareaRef}
        className={styles.manuscriptInput}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Текст сочинения"
      />
      <div className={styles.manuscriptGrid} aria-hidden="true">
        {grid.map((row, i) => (
          <div key={i} className={styles.manuscriptRow}>
            {row.map((cell, j) => (
              <span key={j} className="kr">
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
