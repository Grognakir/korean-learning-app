import { formatBold } from "@/lib/formatBold";
import type { GrammarPointBlock } from "@/features/learning/types";
import { LabelTranslation } from "./LabelTranslation";
import styles from "./blocks.module.css";

export function GrammarPoint({
  block,
  id,
}: {
  block: GrammarPointBlock;
  id?: string;
}) {
  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>문법{block.section}</span>
        <LabelTranslation translation="Грамматика" />
      </span>
      {block.explanation ? (
        <details className={styles.grammarDetails}>
          <summary className={styles.grammarSummary}>
            <span className={`${styles.pattern} kr`}>{block.pattern}</span>
            <svg
              className={styles.grammarToggleIcon}
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
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
          <p className={styles.explanation}>{formatBold(block.explanation)}</p>
          {block.rules && block.rules.length > 0 && (
            <ul className={styles.rules}>
              {block.rules.map((rule, i) => (
                <li key={i}>{formatBold(rule)}</li>
              ))}
            </ul>
          )}
        </details>
      ) : (
        <span className={`${styles.pattern} kr`}>{block.pattern}</span>
      )}
      <div className={styles.examples}>
        {block.examples.map((example, i) => (
          <p key={i} className={`${styles.example} kr`}>
            {example}
          </p>
        ))}
      </div>
    </div>
  );
}
