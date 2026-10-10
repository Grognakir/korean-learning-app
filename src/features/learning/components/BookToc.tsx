import Link from "next/link";
import type { BookToc as BookTocData } from "../data/bookToc";
import styles from "./BookToc.module.css";

const COLUMNS = [
  "단원",
  "준비하기 1",
  "문법",
  "준비하기 2",
  "문법",
  "말하기",
  "듣고 말하기",
  "읽고 말하기",
  "쓰기",
  "문화 이해하기",
  "발음",
];

function Grammar({ items }: { items: string[] }) {
  return (
    <ul className={styles.grammar}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

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
              {COLUMNS.map((name, i) => (
                <th key={i} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {toc.lessons.map((row) => (
              <tr key={row.lesson}>
                <th scope="row" className={styles.unit}>
                  {availableLessons.has(row.lesson) ? (
                    <Link
                      href={`/learning/plans/${textbookSlug}/${row.lesson}`}
                      className={styles.unitLink}
                    >
                      <span className={styles.unitNumber}>{row.lesson}과</span>
                      <span>{row.unit}</span>
                    </Link>
                  ) : (
                    <>
                      <span className={styles.unitNumber}>{row.lesson}과</span>
                      <span>{row.unit}</span>
                    </>
                  )}
                </th>
                <td>{row.prep1.topic}</td>
                <td>
                  <Grammar items={row.prep1.grammar} />
                </td>
                <td>{row.prep2.topic}</td>
                <td>
                  <Grammar items={row.prep2.grammar} />
                </td>
                <td>{row.speaking}</td>
                <td>{row.listening}</td>
                <td>{row.reading}</td>
                <td>{row.writing}</td>
                <td>{row.culture}</td>
                <td>
                  {row.pronunciation.map((line) => (
                    <span key={line} className={styles.pronLine}>
                      {line}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
