import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "./learning.module.css";

export type LessonListItem =
  | { lessonNumber: number; href: string; title: string }
  | { lessonNumber: number; href: string }
  | { lessonNumber: number };

function lessonColumnSpan(label: string, cols = 8): number {
  let units = 0;
  for (const ch of label) {
    if (ch === " " || ch === "·") units += 0.4;
    else if (/[가-힣]/.test(ch)) units += 1;
    else units += 0.62;
  }
  return Math.min(cols, Math.max(1, Math.ceil((units + 2) / 6.5)));
}

export function LessonList({ items }: { items: LessonListItem[] }) {
  return (
    <ul className={styles.lessonList}>
      {items.map((item) => {
        if ("title" in item) {
          const label = `${item.lessonNumber}과 · ${item.title}`;
          const span = lessonColumnSpan(label);
          return (
            <li
              key={item.lessonNumber}
              className={styles.lessonItemWide}
              style={{ "--span": String(span) } as CSSProperties}
            >
              <Link
                href={item.href}
                className={`${styles.lessonLink} ${styles.lessonLinkWide} kr`}
              >
                {label}
              </Link>
            </li>
          );
        }
        if ("href" in item) {
          return (
            <li key={item.lessonNumber}>
              <Link href={item.href} className={styles.lessonLink}>
                Урок {item.lessonNumber}
              </Link>
            </li>
          );
        }
        return (
          <li key={item.lessonNumber}>
            <span className={styles.lessonStub} title="Скоро">
              Урок {item.lessonNumber}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
