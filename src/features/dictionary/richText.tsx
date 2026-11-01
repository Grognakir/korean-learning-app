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

// ~~зачёркнутое~~ — неверная форма; корейский шрифт сохраняется.
function strike(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(/~~(.+?)~~/g).forEach((seg, k) => {
    if (k % 2 === 1) out.push(<s key={`${keyPrefix}-x${k}`}>{withKr(seg, `${keyPrefix}-y${k}`)}</s>);
    else out.push(...withKr(seg, `${keyPrefix}-z${k}`));
  });
  return out;
}

// Пункты списка: строка, начинающаяся с «– », вкладывается в предыдущий пункт;
// после «\n» идёт пример — отдельной строкой с чертой слева.
function BulletText({ text, exampleClassName }: { text: string; exampleClassName?: string }) {
  const [head, ...examples] = text.split("\n");
  return (
    <>
      {formatRich(head)}
      {examples.map((line, i) => (
        <div key={i} className={exampleClassName}>
          {formatRich(line)}
        </div>
      ))}
    </>
  );
}

type BulletNode = { text: string; children: BulletNode[] };

function bulletTree(items: string[]): BulletNode[] {
  const roots: BulletNode[] = [];
  const stack: BulletNode[] = [];
  for (const item of items) {
    let depth = 0;
    let text = item;
    while (text.startsWith("– ") && depth < stack.length + 1) {
      depth += 1;
      text = text.slice(2);
    }
    const node: BulletNode = { text, children: [] };
    if (depth === 0 || stack.length === 0) {
      roots.push(node);
      stack.length = 0;
      stack.push(node);
    } else {
      const parentDepth = Math.min(depth, stack.length);
      stack[parentDepth - 1].children.push(node);
      stack.length = parentDepth;
      stack.push(node);
    }
  }
  return roots;
}

export function BulletItems({
  items,
  className,
  exampleClassName,
}: {
  items: string[];
  className?: string;
  exampleClassName?: string;
}) {
  const render = (nodes: BulletNode[]): ReactNode =>
    nodes.map((node, i) => (
      <li key={i}>
        <BulletText text={node.text} exampleClassName={exampleClassName} />
        {node.children.length > 0 && <ul className={className}>{render(node.children)}</ul>}
      </li>
    ));
  return <>{render(bulletTree(items))}</>;
}

// {{конструкция|краткое значение}} — жирный чип с подсказкой при наведении;
// **жирный** и корейский шрифт — как обычно.
export function formatRich(rawText: string): ReactNode[] {
  // «без받침» / «с받침» в данных слитно — на выводе ставим пробел.
  const text = rawText.replace(/([А-Яа-яЁё])(받침)/g, "$1 $2");
  const parts = text.split(/\{\{(.+?)\|(.+?)\}\}/g);
  const out: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i % 3 === 0) {
      part.split(/\*\*(.+?)\*\*/g).forEach((seg, j) => {
        if (j % 2 === 1) {
          out.push(<strong key={`b${i}-${j}`}>{strike(seg, `s${i}-${j}`)}</strong>);
        } else {
          out.push(...strike(seg, `t${i}-${j}`));
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
