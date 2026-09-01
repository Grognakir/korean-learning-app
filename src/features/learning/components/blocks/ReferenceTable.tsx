import type { ReferenceTableBlock } from "@/features/learning/types";
import styles from "./blocks.module.css";

export function ReferenceTable({
  block,
  id,
}: {
  block: ReferenceTableBlock;
  id?: string;
}) {
  const hasFlags = block.flagUrls?.some(Boolean);

  return (
    <div id={id} className={styles.block}>
      <span className={`${styles.label} kr`}>{block.title}</span>
      {hasFlags ? (
        <div className={styles.countryGrid}>
          {block.columns.map((column, i) => {
            const translation = block.translations?.[i];
            return (
              <div key={column} className={styles.countryCell}>
                {block.flagUrls?.[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={block.flagUrls[i]!}
                    alt=""
                    className={styles.countryFlag}
                  />
                )}
                <span className={styles.vocabItem}>
                  <button type="button" className={`${styles.vocabKo} kr`}>
                    {column}
                  </button>
                  {translation && (
                    <span className={styles.vocabTranslation} role="tooltip">
                      {translation}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.tableColumns}>
          {block.columns.map((column) => (
            <span key={column} className={`${styles.chip} kr`}>
              {column}
            </span>
          ))}
        </div>
      )}
      {block.note && <span className={styles.note}>{block.note}</span>}
    </div>
  );
}
