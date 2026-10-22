import Link from "next/link";
import type { LessonNav } from "@/features/learning/lessonNav";
import styles from "../lesson.module.css";

function NavList({ nav }: { nav: LessonNav }) {
  return (
    <ul className={styles.navList}>
      {nav.sections.map((section, i) => {
        const isCurrent = i === nav.currentIndex;
        if (!section.available) {
          return (
            <li key={section.key} className={styles.navItemSoon} title="Скоро">
              <span className="kr">{section.key}</span>
            </li>
          );
        }
        return (
          <li key={section.key}>
            <Link
              href={section.href}
              className={`${styles.navItem} ${isCurrent ? styles.navItemCurrent : ""} kr`}
              aria-current={isCurrent ? "page" : undefined}
            >
              {section.key}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SectionNav({ nav }: { nav: LessonNav }) {
  const current = nav.sections[nav.currentIndex];
  return (
    <>
      <aside className={styles.sectionAside}>
        <NavList nav={nav} />
      </aside>
      <details className={styles.mobileToc}>
        <summary className={styles.mobileTocSummary}>
          <span>
            Содержание{current ? <span className="kr"> · {current.key}</span> : null}
          </span>
          <svg className={styles.mobileTocIcon} viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M6 3l5 5-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <NavList nav={nav} />
      </details>
    </>
  );
}
