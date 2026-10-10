import Link from "next/link";
import type { BookToc as BookTocData } from "../data/bookToc";
import styles from "./BookToc.module.css";

export function BookToc({
  toc,
  textbookSlug,
  availableLessons,
}: {
  toc: BookTocData;
  textbookSlug: string;
  availableLessons: Set<number>;
}) {
  return (
    <details className={styles.details} open>
      <summary className={styles.summary}>
        <span className={styles.summaryTitle}>Содержание книги</span>
        <span className={`${styles.summaryKr} kr`}>{toc.title}</span>
        <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
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
      <div className={styles.scroll}>
        <table className={`${styles.table} kr`}>
          <thead>
            <tr>
              <th scope="col">단원</th>
              <th scope="col">문법</th>
            </tr>
          </thead>
          <tbody>
            {toc.lessons.map((row) => {
              const lessonHref = `/learning/plans/${textbookSlug}/${row.lesson}`;
              const available = availableLessons.has(row.lesson);
              return (
                <tr key={row.lesson}>
                  <th scope="row" className={styles.unit}>
                    {available ? (
                      <Link href={lessonHref} className={styles.button}>
                        <span className={styles.unitNumber}>{row.lesson}과</span>
                        <span>{row.unit}</span>
                      </Link>
                    ) : (
                      <span className={styles.plain}>
                        <span className={styles.unitNumber}>{row.lesson}과</span>
                        <span>{row.unit}</span>
                      </span>
                    )}
                  </th>
                  <td>
                    <ul className={styles.grammar}>
                      {row.grammar.map((g) => (
                        <li key={g.label}>
                          {available && g.section && g.block ? (
                            <Link
                              href={`${lessonHref}/${encodeURIComponent(g.section)}#${g.block}`}
                              className={styles.button}
                            >
                              {g.label}
                            </Link>
                          ) : (
                            <span className={styles.plain}>{g.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
