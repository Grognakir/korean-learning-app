import Link from "next/link";
import { formatBold } from "@/lib/formatBold";
import type { GrammarPointBlock } from "@/features/learning/types";
import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

export function GrammarPoint({
  block,
  id,
  vocabItems,
}: {
  block: GrammarPointBlock;
  id?: string;
  vocabItems?: VocabItem[];
}) {
  const seenVocab = new Set<string>();

  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>문법{block.section}</span>
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
          <div className={styles.grammarNote}>
            <p className={styles.explanation}>{formatBold(block.explanation)}</p>
            {block.rules && block.rules.length > 0 && (
              <ul className={styles.rules}>
                {block.rules.map((rule, i) => (
                  <li key={i}>{formatBold(rule)}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ) : (
        <span className={`${styles.pattern} kr`}>{block.pattern}</span>
      )}
      <div className={styles.examples}>
        {block.examples.map((example, i) => (
          <p key={i} className={`${styles.example} kr`}>
            {highlightDialogueSpeakers(example, vocabItems, `grammar-${i}-`, seenVocab)}
          </p>
        ))}
      </div>
      {block.details_link &&
        (block.details_link.href ? (
          <Link href={block.details_link.href} className={styles.grammarDetailsAction}>
            {block.details_link.label}
          </Link>
        ) : (
          <button
            type="button"
            className={styles.grammarDetailsAction}
            disabled
            title="Подробный разбор появится позже"
          >
            {block.details_link.label}
          </button>
        ))}
    </div>
  );
}
