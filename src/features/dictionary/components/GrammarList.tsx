"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { VocabChip } from "@/features/learning/components/blocks/VocabChip";
import blockStyles from "@/features/learning/components/blocks/blocks.module.css";
import { createClient } from "@/lib/supabase/client";
import { escapeLike } from "@/lib/supabase/escapeLike";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { Select } from "@/components/ui/Select";
import { buildPageNumbers } from "@/features/dictionary/pagination";
import { useDictionaryPageCache } from "@/features/dictionary/DictionaryCacheContext";
import { usePagedQuery } from "@/features/dictionary/usePagedQuery";
import type { GrammarNote, GrammarPoint } from "@/features/dictionary/types";
import { ListError } from "./ListError";
import styles from "./GrammarList.module.css";

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;

// Корейские слова внутри русского текста получают шрифт .kr (выбранный в
// настройках): соседние корейские слова собираются в один span.
function withKr(text: string, keyPrefix: string): ReactNode[] {
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
function formatRich(text: string): ReactNode[] {
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

const PAGE_SIZE = 15;

// Пункты, начинающиеся с «• », в explanation становятся списком, остальные
// строки — абзацами.
function Explanation({ text }: { text: string }) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const groups: { bullets: boolean; lines: string[] }[] = [];
  for (const line of lines) {
    const bullet = line.startsWith("• ");
    const last = groups[groups.length - 1];
    if (last && last.bullets === bullet) last.lines.push(bullet ? line.slice(2) : line);
    else groups.push({ bullets: bullet, lines: [bullet ? line.slice(2) : line] });
  }
  return (
    <div className={styles.explanation}>
      {groups.map((group, i) =>
        group.bullets ? (
          <ul key={i} className={styles.bulletList}>
            {group.lines.map((line, j) => (
              <li key={j}>{formatRich(line)}</li>
            ))}
          </ul>
        ) : (
          group.lines.map((line, j) => <p key={`${i}-${j}`}>{formatRich(line)}</p>)
        ),
      )}
    </div>
  );
}

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
                <div key={j} className={styles.tableWrap}>
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

function GrammarCard({
  point,
  expanded,
  onToggle,
}: {
  point: GrammarPoint;
  expanded: boolean;
  onToggle: () => void;
}) {
  const examples = Array.isArray(point.examples) ? point.examples : [];
  const hasDetails =
    Boolean(point.explanation) ||
    (point.usage?.length ?? 0) > 0 ||
    (point.rules?.length ?? 0) > 0 ||
    examples.length > 0 ||
    (point.vocab?.length ?? 0) > 0 ||
    (point.notes?.length ?? 0) > 0;

  const body = (
    <div className={styles.cardBody}>
      <div className={styles.titleRow}>
        <span className={`${styles.headword} kr`}>{point.pattern}</span>
      </div>
    </div>
  );

  return (
    <article className={expanded ? styles.cardExpanded : styles.card}>
      {hasDetails ? (
        <button
          type="button"
          className={styles.cardHeader}
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {body}
          <span className={styles.chevron} aria-hidden="true">
            ›
          </span>
        </button>
      ) : (
        <div className={styles.cardHeader}>{body}</div>
      )}
      {expanded && hasDetails && (
        <div className={styles.details} data-tooltip-boundary>
          <div className={styles.chips}>
            {point.lesson_label && (
              <span className={styles.lessonChip}>{point.lesson_label}</span>
            )}
            {(point.grammar_group || point.category) && (
              <span className={styles.metaChip} title="Категория">
                {point.grammar_group ?? point.category.replace(/^\d+\.\s*/, "")}
              </span>
            )}
          </div>
          {point.explanation && <Explanation text={point.explanation} />}
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
      )}
    </article>
  );
}

export function GrammarList({ categories }: { categories: string[] }) {
  const [query, setQuery] = useState("");
  const [rawDebouncedQuery] = useDebouncedValue(query, 300);
  const debouncedQuery = rawDebouncedQuery.trim();
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cache = useDictionaryPageCache<GrammarPoint>();

  const fetchKey = useMemo(
    () => JSON.stringify({ section: "grammar", debouncedQuery, category, page }),
    [debouncedQuery, category, page],
  );

  const run = useCallback(() => {
    const supabase = createClient();
    let q = supabase
      .from("grammar_points")
      .select(
        "id, pattern, short_desc, category, grammar_group, lesson_label, lessons, explanation, usage, rules, examples, vocab, notes, owner_user_id",
        { count: "exact" },
      )
      .order("pattern", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .is("owner_user_id", null);
    if (debouncedQuery) q = q.ilike("pattern", `%${escapeLike(debouncedQuery)}%`);
    if (category) q = q.eq("category", category);
    return q;
  }, [debouncedQuery, category, page]);

  const {
    rows: points,
    totalCount,
    loading,
    error,
    retry,
  } = usePagedQuery<GrammarPoint>({
    cacheKey: fetchKey,
    label: "GrammarList",
    run,
    cache,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = Boolean(debouncedQuery) || Boolean(category);
  const showEmpty = !loading && !error && points.length === 0;

  return (
    <div className={styles.root}>
      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Конструкция…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
            setExpandedId(null);
          }}
          autoComplete="off"
          aria-label="Поиск по грамматике"
        />
        <div className={styles.categorySelect}>
          <Select
            value={category}
            aria-label="Категория"
            onChange={(value) => {
              setCategory(value);
              setPage(1);
              setExpandedId(null);
            }}
            options={[
              { value: "", label: "Все категории" },
              ...categories.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>
      </div>

      {loading && <p className={styles.hint}>Загружаем…</p>}

      {error && <ListError onRetry={retry} />}

      {showEmpty && (
        <p className={styles.hint}>
          {hasFilters ? "Ничего не найдено" : "Грамматики пока нет"}
        </p>
      )}

      {!loading && points.length > 0 && (
        <>
          <ul className={styles.results}>
            {points.map((point) => (
              <li key={point.id}>
                <GrammarCard
                  point={point}
                  expanded={expandedId === point.id}
                  onToggle={() =>
                    setExpandedId(expandedId === point.id ? null : point.id)
                  }
                />
              </li>
            ))}
          </ul>

          <nav className={styles.pagination} aria-label="Страницы">
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => {
                setPage(Math.max(1, page - 1));
                setExpandedId(null);
              }}
              aria-label="Предыдущая страница"
            >
              ‹
            </button>
            {buildPageNumbers(page, totalPages).map((item, i) =>
              item === "…" ? (
                <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={
                    item === page ? styles.pageBtnActive : styles.pageBtn
                  }
                  onClick={() => {
                    setPage(item);
                    setExpandedId(null);
                  }}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => {
                setPage(Math.min(totalPages, page + 1));
                setExpandedId(null);
              }}
              aria-label="Следующая страница"
            >
              ›
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
