import Link from "next/link";
import { RichExplanation, formatRich } from "@/features/dictionary/richText";
import type { GrammarPointBlock } from "@/features/learning/types";
import { GrammarDetailsButton } from "./GrammarDetailsButton";
import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

export function GrammarPoint({
  block,
  id,
  vocabItems,
  hasDictionary = false,
}: {
  block: GrammarPointBlock;
  id?: string;
  vocabItems?: VocabItem[];
  /** В словаре есть конструкция с таким же pattern — показываем «Изучить подробнее». */
  hasDictionary?: boolean;
}) {
  const seenVocab = new Set<string>();

  // Прежняя заглушка/ссылка details_link — только когда статьи в словаре нет.
  const legacyAction =
    !hasDictionary &&
    block.details_link &&
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
    ));

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
            {hasDictionary && <GrammarDetailsButton pattern={block.pattern} variant="summary" />}
          </summary>
          <div className={styles.grammarNote}>
            <RichExplanation
              text={block.explanation}
              className={styles.explanationBody}
              paragraphClassName={styles.explanation}
              listClassName={styles.rules}
            />
            {block.rules && block.rules.length > 0 && (
              <div className={styles.rulesSection}>
                <span className={styles.rulesLabel}>Правила</span>
                <ul className={styles.rules}>
                  {block.rules.map((rule, i) => (
                    <li key={i}>{formatRich(rule)}</li>
                  ))}
                </ul>
              </div>
            )}
            {legacyAction}
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
      {!block.explanation &&
        (hasDictionary ? (
          <GrammarDetailsButton pattern={block.pattern} variant="footer" />
        ) : (
          legacyAction
        ))}
    </div>
  );
}
