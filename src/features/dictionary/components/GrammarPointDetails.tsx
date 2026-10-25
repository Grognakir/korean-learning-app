import type { GrammarNote, GrammarPoint } from "@/features/dictionary/types";
import { RichExplanation, formatRich } from "@/features/dictionary/richText";
import styles from "./GrammarPointDetails.module.css";

function GrammarNotes({ notes }: { notes: GrammarNote[] }) {
  return (
    <>
      {notes.map((note, i) => (
        <section key={i} className={styles.note}>
          <h3 className={styles.noteTitle}>{formatRich(note.title)}</h3>
          {note.blocks.map((block, j) => {
            if (block.type === "text") {
              return (
                <p key={j} className={styles.noteText}>
                  {formatRich(block.text)}
                </p>
              );
            }
            if (block.type === "bullets") {
              return (
                <ul key={j} className={styles.bulletList}>
                  {block.items.map((item, k) => (
                    <li key={k}>{formatRich(item)}</li>
                  ))}
                </ul>
              );
            }
            if (block.type === "table") {
              return (
                <div
                  key={j}
                  className={block.head.length === 2 ? styles.tableWrapOpen : styles.tableWrap}
                >
                  <table
                    className={
                      block.head.length === 2
                        ? `${styles.noteTable} ${styles.stackOnMobile}`
                        : styles.noteTable
                    }
                  >
                    <thead>
                      <tr>
                        {block.head.map((cell, k) => (
                          <th key={k} scope="col">
                            {formatRich(cell)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, k) => (
                        <tr key={k}>
                          {row.map((cell, l) =>
                            l === 0 && block.head[0] === "" ? (
                              <th key={l} scope="row">
                                {formatRich(cell)}
                              </th>
                            ) : (
                              <td key={l} data-label={block.head[l]}>
                                {formatRich(cell)}
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return (
              <ul key={j} className={styles.examples}>
                {block.items.map((ex, k) => (
                  <li key={k} className={styles.example}>
                    <span className="kr">{ex.kr}</span>
                    <span className={styles.exampleRu}>{ex.ru}</span>
                  </li>
                ))}
              </ul>
            );
          })}
        </section>
      ))}
    </>
  );
}

// Полная карточка конструкции из словаря: чипы, объяснение, правила, примеры,
// сноски. Используется в списке словаря и в модальном окне из урока.
export function GrammarPointDetails({ point }: { point: GrammarPoint }) {
  const examples = Array.isArray(point.examples) ? point.examples : [];
  return (
    <div className={styles.content} data-tooltip-boundary>
      <div className={styles.chips}>
        {point.lesson_label && <span className={styles.lessonChip}>{point.lesson_label}</span>}
        {(point.grammar_group || point.category) && (
          <span className={styles.metaChip} title="Категория">
            {point.grammar_group ?? point.category.replace(/^\d+\.\s*/, "")}
          </span>
        )}
      </div>
      {point.explanation && (
        <RichExplanation
          text={point.explanation}
          className={styles.explanation}
          listClassName={styles.bulletList}
        />
      )}
      {(point.usage?.length ?? 0) > 0 && (
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Когда используется</span>
          <ul className={styles.bulletList}>
            {point.usage!.map((line, i) => (
              <li key={i}>{formatRich(line)}</li>
            ))}
          </ul>
        </div>
      )}
      {(point.rules?.length ?? 0) > 0 && (
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Правила</span>
          <ul className={styles.bulletList}>
            {point.rules!.map((line, i) => (
              <li key={i}>{formatRich(line)}</li>
            ))}
          </ul>
        </div>
      )}
      {examples.length > 0 && (
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Примеры</span>
          <ul className={styles.examples}>
            {examples.map((ex, i) => (
              <li key={i} className={styles.example}>
                <span className="kr">{ex.kr}</span>
                <span className={styles.exampleRu}>{ex.ru}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(point.notes?.length ?? 0) > 0 && <GrammarNotes notes={point.notes!} />}
      {(point.vocab?.length ?? 0) > 0 && (
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Связанные слова</span>
          <ul className={styles.examples}>
            {point.vocab!.map((v, i) => (
              <li key={i} className={styles.example}>
                <span className="kr">{v.kr}</span>
                <span className={styles.exampleRu}>{v.ru}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
