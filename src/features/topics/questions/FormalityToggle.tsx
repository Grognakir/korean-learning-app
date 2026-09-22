"use client";

import { useState } from "react";
import styles from "./QuestionsTopic.module.css";

type StyleKey = "formal" | "polite" | "casual";

const STYLE_DATA: Record<
  StyleKey,
  { label: string; verbStmt: string; verbQ: string; copStmt: string; copQ: string; note: string }
> = {
  formal: {
    label: "격식체",
    verbStmt: "갑니다",
    verbQ: "갑니까?",
    copStmt: "학생입니다",
    copQ: "학생입니까?",
    note: "격식체 — официальная обстановка, доклады, дикторы новостей.",
  },
  polite: {
    label: "해요체",
    verbStmt: "가요",
    verbQ: "가요?",
    copStmt: "학생이에요",
    copQ: "학생이에요?",
    note: "해요체 — самый частый вежливый нейтральный стиль в повседневном общении. Утверждение и вопрос выглядят одинаково на письме — разница только в интонации на слух.",
  },
  casual: {
    label: "반말",
    verbStmt: "가",
    verbQ: "가?",
    copStmt: "학생이야",
    copQ: "학생이야?",
    note: "반말 — с друзьями и младшими по возрасту. За рамками базовой программы TOPIK I, но полезно узнавать на слух.",
  },
};

export function FormalityToggle() {
  const [active, setActive] = useState<StyleKey>("polite");
  const d = STYLE_DATA[active];

  return (
    <div>
      <div className={styles.toggleRow}>
        {(Object.keys(STYLE_DATA) as StyleKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.toggleButton} ${active === key ? styles.toggleButtonActive : ""}`}
            onClick={() => setActive(key)}
          >
            {STYLE_DATA[key].label}
          </button>
        ))}
      </div>

      <div className={styles.styleCard}>
        <div className={styles.styleRow}>
          <span className={styles.styleLabel}>
            <span className="kr">가다</span>
            <br />
            идти
          </span>
          <div className={styles.stylePair}>
            <div className={styles.styleItem}>
              <span className={styles.styleK}>утверждение</span>
              <span className={`${styles.styleV} kr`}>{d.verbStmt}</span>
            </div>
            <div className={styles.styleItem}>
              <span className={styles.styleK}>вопрос</span>
              <span className={`${styles.styleV} ${styles.styleVAccent} kr`}>{d.verbQ}</span>
            </div>
          </div>
        </div>
        <div className={styles.styleRow}>
          <span className={styles.styleLabel}>
            <span className="kr">학생이다</span>
            <br />
            быть студентом
          </span>
          <div className={styles.stylePair}>
            <div className={styles.styleItem}>
              <span className={styles.styleK}>утверждение</span>
              <span className={`${styles.styleV} kr`}>{d.copStmt}</span>
            </div>
            <div className={styles.styleItem}>
              <span className={styles.styleK}>вопрос</span>
              <span className={`${styles.styleV} ${styles.styleVAccent} kr`}>{d.copQ}</span>
            </div>
          </div>
        </div>
      </div>
      <p className={styles.styleNote}>{d.note}</p>
    </div>
  );
}
