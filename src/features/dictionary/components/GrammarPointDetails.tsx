import type { GrammarNote, GrammarNoteBlock, GrammarPoint } from "@/features/dictionary/types";
import { RichExplanation, formatRich, richItem } from "@/features/dictionary/richText";
import { areaLabel } from "@/features/trainers/grammar/areas";
import styles from "./GrammarPointDetails.module.css";

// Таблица из трёх и более столбцов: первый столбец — заголовки строк.
export function NoteTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div
        className={head.length === 2 ? styles.tableWrapOpen : styles.tableWrap}
    >
      <table
        className={
          head.length === 2
            ? `${styles.noteTable} ${styles.stackOnMobile}`
            : styles.noteTable
        }
      >
        <thead>
          <tr>
            {head.map((cell, k) => (
              <th key={k} scope="col">
                {formatRich(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, k) => (
            <tr key={k}>
              {row.map((cell, l) =>
                l === 0 && head.length >= 3 ? (
                  <th key={l} scope="row">
                    {formatRich(cell)}
                  </th>
                ) : (
                  <td key={l} data-label={head[l]}>
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

function NoteBlocks({ blocks }: { blocks: GrammarNoteBlock[] }) {
  return (
    <>
      {blocks.map((block, j) => {
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
                <li key={k}>{richItem(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "table") {
          return <NoteTable key={j} head={block.head} rows={block.rows} />;
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
    </>
  );
}

function GrammarNotes({ notes }: { notes: GrammarNote[] }) {
  return (
    <>
      {notes.map((note, i) => (
        <section key={i} className={styles.note}>
          <h3 className={styles.noteTitle}>{formatRich(note.title)}</h3>
          <NoteBlocks blocks={note.blocks} />
        </section>
      ))}
    </>
  );
}

// Разделы с подписью, как «Правила» и «Примеры».
function GrammarSections({ notes }: { notes: GrammarNote[] }) {
  return (
    <>
      {notes.map((note, i) => (
        <div key={i} className={note.callout ? styles.callout : styles.detailSection}>
          <span className={styles.detailLabel}>{note.title}</span>
          <NoteBlocks blocks={note.blocks} />
        </div>
      ))}
    </>
  );
}

// Полная карточка конструкции из словаря: чипы, объяснение, правила, примеры,
// сноски. Используется в списке словаря и в модальном окне из урока.
export function GrammarPointDetails({ point }: { point: GrammarPoint }) {
  const examples = Array.isArray(point.examples) ? point.examples : [];
  const sectionNotes = (point.notes ?? []).filter((note) => note.section && !note.after_examples);
  const sectionNotesAfter = (point.notes ?? []).filter((note) => note.section && note.after_examples);
  const footNotes = (point.notes ?? []).filter((note) => !note.section);
  // Чипы короткие: grammar_group («Тема|Подтема» через «|») или сокращённая категория.
  const tags = point.grammar_group
    ? point.grammar_group.split("|").map((tag) => tag.trim()).filter(Boolean)
    : point.category
      ? [areaLabel(point.category)]
      : [];
  return (
    <div className={styles.content} data-tooltip-boundary>
      <div className={styles.chips}>
        {point.lesson_label && <span className={styles.lessonChip}>{point.lesson_label}</span>}
        {tags.map((tag) => (
          <span key={tag} className={styles.metaChip} title="Категория">
            {tag}
          </span>
        ))}
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
      {sectionNotes.length > 0 && <GrammarSections notes={sectionNotes} />}
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
      {sectionNotesAfter.length > 0 && <GrammarSections notes={sectionNotesAfter} />}
      {footNotes.length > 0 && <GrammarNotes notes={footNotes} />}
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
