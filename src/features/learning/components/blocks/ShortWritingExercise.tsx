"use client";

import type { ShortWritingExerciseBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { Manuscript } from "./Manuscript";
import { VocabChip } from "./VocabChip";
import { highlightDialogueSpeakers } from "./vocabHighlight";
import styles from "./blocks.module.css";

const MANUSCRIPT_ROWS = 12;

export function ShortWritingExercise({
  block,
  id,
  textbookSlug,
  lessonNumber,
}: {
  block: ShortWritingExerciseBlock;
  id?: string;
  textbookSlug?: string;
  lessonNumber?: number;
}) {
  const seenByTask = block.tasks.map(() => new Set<string>());
  const hl = (taskIndex: number, text: string, prefix: string) =>
    highlightDialogueSpeakers(text, block.expressions, prefix, seenByTask[taskIndex]);
  const draftKey = `writing:${textbookSlug ?? "book"}:${lessonNumber ?? "lesson"}:${block.id ?? id ?? "short-writing"}`;
  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
        {block.title_ru && <LabelInfo translation={block.title_ru} />}
      </span>
      {block.expressions && block.expressions.length > 0 && (
        <div className={styles.vocabItems}>
          {block.expressions.map((item, i) => (
            <VocabChip key={`${item.ko}-${i}`} text={item.ko} translation={item.translation_ru} />
          ))}
        </div>
      )}
      {block.hints && block.hints.length > 0 && (
        <details className={`${styles.grammarDetails} ${styles.transcriptDetails}`}>
          <summary className={`${styles.grammarSummary} ${styles.grammarSummaryCompact}`}>
            <span className={`${styles.transcriptTitle} kr`}>힌트</span>
            <svg className={styles.grammarToggleIcon} viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul className={styles.shortWritingHints}>
            {block.hints.map((hint, i) => (
              <li key={i} className="kr">
                {highlightDialogueSpeakers(hint, block.expressions, `hint${i}-`, new Set<string>())}
              </li>
            ))}
          </ul>
        </details>
      )}
      {block.tasks.map((task, i) => (
        <section key={i} className={styles.shortWritingTask}>
          <p className={`${styles.writingStep} kr`}>
            {hl(i, task.prompt, `p${i}-`)}
            {task.prompt_ru && <LabelInfo translation={task.prompt_ru} />}
          </p>
          <div className={styles.shortWritingTableWrap}>
            <table className={`${styles.comprehensionTable} ${styles.shortWritingTable}`}>
              <thead>
                <tr>
                  {task.table.head.map((cell, j) => (
                    <th key={j} className="kr">{hl(i, cell, `h${i}-${j}-`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {task.table.rows.map((row, j) => (
                  <tr key={j}>
                    {row.map((cell, k) => (
                      <td key={k} className="kr">{hl(i, cell, `c${i}-${j}-${k}-`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {task.reasons && (
            <div className={styles.shortWritingReasons}>
              <span className="kr">{hl(i, task.reasons.label, `rl${i}-`)}</span>
              <ul>
                {task.reasons.items.map((item, j) => (
                  <li key={j} className="kr">{hl(i, item, `ri${i}-${j}-`)}</li>
                ))}
              </ul>
            </div>
          )}
          <Manuscript rows={MANUSCRIPT_ROWS} storageKey={`${draftKey}:task:${i}`} />
        </section>
      ))}
    </div>
  );
}
