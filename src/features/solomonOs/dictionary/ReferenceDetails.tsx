import type { GrammarNoteBlock } from "@/features/dictionary/types";
import type { LibraryRecord } from "./reference";
import styles from "./Dictionary.module.css";

function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|~~[^~]+~~)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith("~~") ? <s key={i}>{part.slice(2, -2)}</s> : <span key={i}>{part}</span>)}</>;
}
function Block({ block }: { block: GrammarNoteBlock }) {
  if (block.type === "text") return <p><Rich text={block.text}/></p>;
  if (block.type === "bullets") return <ul>{block.items.map((item, i) => <li key={i}><Rich text={item}/></li>)}</ul>;
  if (block.type === "examples") return <ul className={styles.examples}>{block.items.map((item, i) => <li key={i}><span className="kr"><Rich text={item.kr}/></span><small>{item.ru}</small></li>)}</ul>;
  return <div className={styles.referenceTable}><table><thead><tr>{block.head.map((cell, i) => <th key={i} scope="col"><Rich text={cell}/></th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}><Rich text={cell}/></td>)}</tr>)}</tbody></table></div>;
}
export function ReferenceDetails({ record, showTitle = true }: { record: LibraryRecord; showTitle?: boolean }) {
  return <article className={styles.reference} aria-label={`Справка: ${record.ko}`}>{showTitle && <><h3 className="kr">{record.ko}</h3><p>{record.ru}</p></>}{record.sections.map((section, i) => <section key={i}><h4>{section.title}</h4>{section.blocks.map((block, j) => <Block key={j} block={block}/>)}</section>)}</article>;
}
