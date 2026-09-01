"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { escapeLike } from "@/lib/supabase/escapeLike";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { Select } from "@/components/ui/Select";
import { buildPageNumbers } from "@/features/dictionary/pagination";
import { usePagedQuery } from "@/features/dictionary/usePagedQuery";
import type { GrammarPoint } from "@/features/dictionary/types";
import { ListError } from "./ListError";
import styles from "./GrammarList.module.css";

const PAGE_SIZE = 15;

function formatBold(text: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
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
    (point.vocab?.length ?? 0) > 0;

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
        <div className={styles.details}>
          {point.lesson_label && (
            <span className={styles.lessonChip}>{point.lesson_label}</span>
          )}
          {point.explanation && (
            <p className={styles.explanation}>
              {formatBold(point.explanation)}
            </p>
          )}
          {(point.usage?.length ?? 0) > 0 && (
            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Когда используется</span>
              <ul className={styles.bulletList}>
                {point.usage!.map((line, i) => (
                  <li key={i}>{formatBold(line)}</li>
                ))}
              </ul>
            </div>
          )}
          {(point.rules?.length ?? 0) > 0 && (
            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Правила</span>
              <ul className={styles.bulletList}>
                {point.rules!.map((line, i) => (
                  <li key={i}>{formatBold(line)}</li>
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

  const fetchKey = useMemo(
    () => JSON.stringify({ debouncedQuery, category, page }),
    [debouncedQuery, category, page],
  );

  const run = useCallback(() => {
    const supabase = createClient();
    let q = supabase
      .from("grammar_points")
      .select(
        "id, pattern, short_desc, category, grammar_group, lesson_label, lessons, explanation, usage, rules, examples, vocab, owner_user_id",
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
