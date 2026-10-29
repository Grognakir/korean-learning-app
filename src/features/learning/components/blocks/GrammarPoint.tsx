import { NoteTable } from "@/features/dictionary/components/GrammarPointDetails";
import { RichExplanation, formatRich } from "@/features/dictionary/richText";
import type { GrammarPointBlock } from "@/features/learning/types";
import { GrammarDetailsButton } from "./GrammarDetailsButton";
import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

export function GrammarPoint({
  block,
  id,
  vocabItems,
  dictionaryRef = null,
}: {
  block: GrammarPointBlock;
  id?: string;
  vocabItems?: VocabItem[];
  /** external_id статьи словаря; null — статьи нет, окно покажет описание из урока. */
  dictionaryRef?: string | null;
}) {
  const seenVocab = new Set<string>();
  const actions = (variant: "top" | "footer" | "standalone") => (
    <span
      className={`${styles.grammarActions} ${
        variant === "top"
          ? styles.grammarActionsTop
          : variant === "footer"
            ? styles.grammarActionsFooter
            : ""
      }`}
    >
      <GrammarDetailsButton block={block} dictionaryRef={dictionaryRef} />
    </span>
  );

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
            {actions("top")}
          </summary>
          <div className={styles.grammarNote}>
            <RichExplanation
              text={block.explanation}
              className={styles.explanationBody}
              paragraphClassName={styles.explanation}
              listClassName={styles.rules}
            />
            {block.rules_table ? (
              <div className={styles.rulesSection}>
                <span className={styles.rulesLabel}>Правила</span>
                <NoteTable
                  head={block.rules_table.head}
                  rows={block.rules_table.rows}
                />
              </div>
            ) : (
              block.rules &&
              block.rules.length > 0 && (
                <div className={styles.rulesSection}>
                  <span className={styles.rulesLabel}>Правила</span>
                  <ul className={styles.rules}>
                    {block.rules.map((rule, i) => (
                      <li key={i}>{formatRich(rule)}</li>
                    ))}
                  </ul>
                </div>
              )
            )}
            {actions("footer")}
          </div>
        </details>
      ) : (
        <span className={`${styles.pattern} kr`}>{block.pattern}</span>
      )}
      <div className={styles.examples}>
        {block.examples.map((example, i) => (
          <p key={i} className={`${styles.example} kr`}>
            {highlightDialogueSpeakers(
              example,
              vocabItems,
              `grammar-${i}-`,
              seenVocab,
            )}
          </p>
        ))}
      </div>
      {!block.explanation && actions("standalone")}
    </div>
  );
}
