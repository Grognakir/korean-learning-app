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
          Содержание{current ? <span className="kr"> · {current.key}</span> : null}
        </summary>
        <NavList nav={nav} />
      </details>
    </>
  );
}
