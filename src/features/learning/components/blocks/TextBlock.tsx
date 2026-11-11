import type { ReactNode } from "react";
import type {
  HintBlock,
  TextBlock as TextBlockType,
  TextLine,
} from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { HintSection } from "./HintSection";
import { OpenTemplateDialogue } from "./OpenTemplateDialogue";
import { speakerClassName } from "./speakerClassName";
import { highlightDialogueSpeakers, type VocabItem } from "./vocabHighlight";
import styles from "./blocks.module.css";

function lineClassName(textKind: TextBlockType["text_kind"], lineKind: TextLine["line_kind"]) {
  if (textKind === "invitation") {
    if (lineKind === "signature") return styles.invitationSignature;
    if (lineKind === "list-item") return styles.invitationListItem;
    return styles.invitationParagraph;
  }
  if (textKind === "article") {
    if (lineKind === "heading") return styles.articleHeading;
    if (lineKind === "subheading") return styles.articleSubheading;
    if (lineKind === "list-item") return styles.articleListItem;
    if (lineKind === "meta") return styles.articleMeta;
    return styles.articleParagraph;
  }
  return styles.line;
}

function renderLineText(
  line: TextLine,
  vocabItems: VocabItem[] | undefined,
  seenVocab: Set<string>,
) {
  const render = (text: string, keyPrefix: string) =>
    highlightDialogueSpeakers(
      text,
      vocabItems,
      keyPrefix,
      seenVocab,
      line.emphasized ?? [],
      styles.emphasized,
    );
  const struck = line.struck?.filter((fragment) => line.text.includes(fragment)) ?? [];
  if (!struck.length) {
    return <span className={`${styles.lineText} kr`}>{render(line.text, "")}</span>;
  }
  const parts: { text: string; struck: boolean }[] = [];
  let from = 0;
  for (const fragment of struck) {
    const at = line.text.indexOf(fragment, from);
    if (at === -1) continue;
    if (at > from) parts.push({ text: line.text.slice(from, at), struck: false });
    parts.push({ text: fragment, struck: true });
    from = at + fragment.length;
  }
  if (from < line.text.length) parts.push({ text: line.text.slice(from), struck: false });
  return (
    <span className={`${styles.lineText} kr`}>
      {parts.map((part, i) =>
        part.struck ? (
          <s key={i} className={styles.struckText}>
            {render(part.text, `s${i}-`)}
          </s>
        ) : (
          <span key={i}>{render(part.text, `s${i}-`)}</span>
        ),
      )}
    </span>
  );
}

/** Заголовок статьи и сразу следующая за ним строка-справка (например
 * "ID : inha 0817") стоят в одной строке: заголовок слева, справка справа. */
function renderArticleRows(
  block: TextBlockType,
  isArticle: boolean,
  renderLine: (line: TextLine, index: number) => ReactNode,
): ReactNode[] {
  const rows: ReactNode[] = [];
  for (let i = 0; i < block.lines.length; i++) {
    const line = block.lines[i];
    const next = block.lines[i + 1];
    if (isArticle && line.line_kind === "heading" && next?.line_kind === "meta") {
      rows.push(
        <div key={i} className={styles.articleTitleRow}>
          {renderLine(line, i)}
          {renderLine(next, i + 1)}
        </div>,
      );
      i++;
    } else {
      rows.push(renderLine(line, i));
    }
  }
  return rows;
}

export function TextBlock({
  block,
  id,
  vocabItems,
  relatedHints,
  titleSuffix,
}: {
  block: TextBlockType;
  id?: string;
  vocabItems?: VocabItem[];
  relatedHints?: HintBlock[];
  /** См. GrammarExercise — тот же суффикс "-1"/"-2" для дополнительного
   * задания того же упражнения (exercise_title совпадает с соседним
   * grammar_exercise). */
  titleSuffix?: number | null;
}) {
  const seenVocab = new Set<string>();
  const isInvitation = block.text_kind === "invitation";
  const isArticle = block.text_kind === "article";

  return (
    <div id={id} className={styles.block}>
      {block.exercise_title && (
        <span className={styles.labelRow}>
          <span className={`${styles.label} kr`}>
            {block.exercise_title}
            {titleSuffix ? `-${titleSuffix}` : ""}
          </span>
        </span>
      )}
      {block.title && (
        <span className={styles.labelRow}>
          <span
            className={`${block.exercise_title ? styles.prompt : styles.dialogueTitle} ${isInvitation ? styles.invitationTitle : ""} kr`}
          >
            {block.title}
          </span>
          {block.title_ru && <LabelInfo translation={block.title_ru} />}
        </span>
      )}
      {block.intro_prompt && (
        <span className={styles.labelRow}>
          <span className={`${styles.prompt} kr`}>{block.intro_prompt}</span>
          {block.intro_prompt_ru && <LabelInfo translation={block.intro_prompt_ru} />}
        </span>
      )}
      {block.illustration?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.illustration.imageUrl}
          alt={block.title ?? ""}
          className={styles.illustrationImage}
        />
      )}
      {block.audioUrl && (
        <audio controls src={block.audioUrl} className={styles.audio} />
      )}
      {block.practice_variants ? (
        <OpenTemplateDialogue lines={block.lines} count={block.practice_variants.count} />
      ) : (
        <div className={isArticle ? styles.articleCard : styles.textLines}>
          {renderArticleRows(block, isArticle, (line, i) => (
            <p key={i} className={lineClassName(block.text_kind, line.line_kind)}>
              {line.speaker && (
                <span className={`${speakerClassName(line.speaker)} kr`}>{line.speaker}:</span>
              )}
              {renderLineText(line, vocabItems, seenVocab)}
              {line.translation_ru && <LabelInfo translation={line.translation_ru} />}
            </p>
          ))}
        </div>
      )}
      {block.table && (
        <div className={styles.comprehensionTableWrap}>
          <table className={styles.comprehensionTable}>
            <thead>
              <tr>
                {block.table.columns.map((col, i) => (
                  <th key={i} className="kr">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {block.table.columns.map((_, colIndex) => (
                  <td key={colIndex} className="kr">
                    {block.table!.rows.map((row, rowIndex) => (
                      <p key={rowIndex}>{row[colIndex]}</p>
                    ))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {relatedHints?.map((hint, i) => <HintSection key={hint.id ?? i} hint={hint} />)}
    </div>
  );
}
