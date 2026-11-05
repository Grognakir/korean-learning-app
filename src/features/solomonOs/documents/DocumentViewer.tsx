"use client";

import type { DocumentRow, DocumentSection, ReadableDocument } from "./types";
import styles from "./DocumentViewer.module.css";

function Card({ row }: { row: DocumentRow }) {
  return <li className={styles.card}>
    {row.hex ? <span className={styles.swatch} style={{ backgroundColor: row.hex }}/> : row.icon ?
      // eslint-disable-next-line @next/next/no-img-element
      <img className={styles.itemIcon} src={row.icon} alt="" width={32} height={32}/> : null}
    <div className={styles.cardText}><b className="kr">{row.ko}</b><span>{row.ru}</span>{row.detailKo && <small className="kr">{row.detailKo}</small>}</div>
  </li>;
}
function SectionContent({ section }: { section: DocumentSection }) {
  if (section.groups.some((group) => group.rows.some((row) => row.icon))) {
    return <div role="region" aria-label={section.titleRu}><ul className={styles.catalog}>
      {section.groups.flatMap((group) => group.rows.map((row) => <Card key={`${group.id}-${row.id}`} row={row}/>))}
    </ul></div>;
  }
  return section.groups.map((group) => <div key={group.id}>
    {group.title && <h4>{group.title}</h4>}
    {group.rows.length > 0 && group.rows.every((row) => row.hex)
      ? <div role="region" aria-label={section.titleRu}><ul className={styles.colors}>{group.rows.map((row) => <Card key={row.id} row={row}/>)}</ul></div>
      : <table><tbody>{group.rows.map((row) => <tr key={row.id}>
        <th scope="row" className="kr">{row.ko}{row.detailKo && <span className={`${styles.detail} kr`}>{row.detailKo}</span>}</th>
        <td>{row.ru}{row.usageKo && <span className={`${styles.detail} kr`}>{row.usageKo}</span>}</td>
      </tr>)}</tbody></table>}
  </div>);
}
export function DocumentViewer({ document }: { document: ReadableDocument | null }) {
  if (!document) return <div className={styles.empty}><b className="kr">문서 뷰어</b><p>Открой документ из любого приложения Solomon OS.</p></div>;
  return <div className={styles.viewer}>
    <header className={styles.header}><div><b className="kr">{document.titleKo}</b><small>{document.source}</small></div><span className="kr">읽기 전용</span></header>
    <div className={styles.body} tabIndex={0} aria-label={`Содержимое документа: ${document.titleRu}`}>
      {document.sections.map((section) => <section key={section.id}><h3 className="kr">{section.titleKo} · {section.titleRu}</h3><SectionContent section={section}/></section>)}
    </div>
  </div>;
}
