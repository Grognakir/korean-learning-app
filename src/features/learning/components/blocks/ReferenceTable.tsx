import type { ReferenceTableBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function ReferenceTable({
  block,
  id,
}: {
  block: ReferenceTableBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={`${styles.label} kr`}>{block.title}</span>
      <div className={styles.tableColumns}>
        {block.columns.map((column) => (
          <span key={column} className={`${styles.chip} kr`}>
            {column}
          </span>
        ))}
      </div>
      {block.note && <span className={styles.note}>{block.note}</span>}
    </div>
  );
}
