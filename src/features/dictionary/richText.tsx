import type { ReactNode } from "react";
import { VocabChip } from "@/features/learning/components/blocks/VocabChip";
import blockStyles from "@/features/learning/components/blocks/blocks.module.css";
import styles from "./richText.module.css";

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;

// Корейские слова внутри русского текста получают шрифт .kr (выбранный в
// настройках): соседние корейские слова собираются в один span.
export function withKr(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let buffer = "";
  let pendingSpace = "";
  let krRun = "";
  let n = 0;
  const flush = () => {
    if (krRun) {
      out.push(
        <span key={`${keyPrefix}-k${n++}`} className="kr">
          {krRun}
        </span>,
      );
      krRun = "";
    }
  };
  for (const token of text.split(/(\s+)/)) {
    if (/^\s+$/.test(token)) {
      if (krRun) pendingSpace += token;
      else buffer += token;
      continue;
    }
    if (HANGUL.test(token)) {
      if (buffer) {
        out.push(buffer);
        buffer = "";
      }
      krRun += pendingSpace + token;
      pendingSpace = "";
    } else {
      flush();
      buffer += pendingSpace + token;
      pendingSpace = "";
    }
  }
  flush();
  buffer += pendingSpace;
  if (buffer) out.push(buffer);
  return out;
}

// {{конструкция|краткое значение}} — жирный чип с подсказкой при наведении;
// **жирный** и корейский шрифт — как обычно.
export function formatRich(text: string): ReactNode[] {
  const parts = text.split(/\{\{(.+?)\|(.+?)\}\}/g);
  const out: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i % 3 === 0) {
      part.split(/\*\*(.+?)\*\*/g).forEach((seg, j) => {
        if (j % 2 === 1) {
          out.push(<strong key={`b${i}-${j}`}>{withKr(seg, `s${i}-${j}`)}</strong>);
        } else {
          out.push(...withKr(seg, `t${i}-${j}`));
        }
      });
    } else if (i % 3 === 1) {
      out.push(
        <VocabChip
          key={`chip-${i}`}
          className={`${blockStyles.inlineVocab} ${styles.hintChip}`}
          text={<strong>{part}</strong>}
          translation={parts[i + 1]}
        />,
      );
    }
  });
  return out;
}

// Строки, начинающиеся с «• », в тексте становятся списком, остальные —
// абзацами. Классы задаёт вызывающий код (словарь и урок оформлены по-разному).
export function RichExplanation({
  text,
  className,
  paragraphClassName,
  listClassName,
}: {
  text: string;
  className?: string;
  paragraphClassName?: string;
  listClassName?: string;
}) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const groups: { bullets: boolean; lines: string[] }[] = [];
  for (const line of lines) {
    const bullet = line.startsWith("• ");
    const last = groups[groups.length - 1];
    if (last && last.bullets === bullet) last.lines.push(bullet ? line.slice(2) : line);
    else groups.push({ bullets: bullet, lines: [bullet ? line.slice(2) : line] });
  }
  return (
    <div className={className}>
      {groups.map((group, i) =>
        group.bullets ? (
          <ul key={i} className={listClassName}>
            {group.lines.map((line, j) => (
              <li key={j}>{formatRich(line)}</li>
            ))}
          </ul>
        ) : (
          group.lines.map((line, j) => (
            <p key={`${i}-${j}`} className={paragraphClassName}>
              {formatRich(line)}
            </p>
          ))
        ),
      )}
    </div>
  );
}
