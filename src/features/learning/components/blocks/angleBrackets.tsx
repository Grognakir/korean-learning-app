import type { ReactNode } from "react";
import styles from "./blocks.module.css";

/** 〈 и 〉 (U+3008/3009) в разных шрифтах и браузерах занимают полный
 * квадрат и дают видимые пробелы вокруг «보기». Символ остаётся в тексте
 * (для копирования), а рисуется узкой CSS-шевронной скобкой. */
export function renderAngleBrackets(text: string): ReactNode {
  if (!/[〈〉]/.test(text)) return text;
  return text.split(/([〈〉])/).map((part, i) =>
    part === "〈" ? (
      <span key={i} className={`${styles.angleBracket} ${styles.angleOpen}`}>
        {part}
      </span>
    ) : part === "〉" ? (
      <span key={i} className={`${styles.angleBracket} ${styles.angleClose}`}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}
