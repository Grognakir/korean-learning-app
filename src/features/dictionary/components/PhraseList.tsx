"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { escapeLike } from "@/lib/supabase/escapeLike";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { Select } from "@/components/ui/Select";
import { buildPageNumbers } from "@/features/dictionary/pagination";
import { usePagedQuery } from "@/features/dictionary/usePagedQuery";
import type { Phrase } from "@/features/dictionary/types";
import { ListError } from "./ListError";
import styles from "./PhraseList.module.css";

const PAGE_SIZE = 15;

function PhraseCard({ phrase }: { phrase: Phrase }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <span className={`${styles.headword} kr`}>{phrase.phrase_kr}</span>
          {phrase.reading && (
            <span className={styles.reading}>{phrase.reading}</span>
          )}
        </div>
        <p className={styles.translations}>{phrase.translation}</p>
        {phrase.usage_note && (
          <p className={styles.usageNote}>{phrase.usage_note}</p>
        )}
      </div>
    </article>
  );
}

export function PhraseList({ categories }: { categories: string[] }) {
  const [query, setQuery] = useState("");
  const [rawDebouncedQuery] = useDebouncedValue(query, 300);
  const debouncedQuery = rawDebouncedQuery.trim();
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const fetchKey = useMemo(
    () => JSON.stringify({ debouncedQuery, category, page }),
    [debouncedQuery, category, page],
  );

  const run = useCallback(() => {
    const supabase = createClient();
    let q = supabase
      .from("phrases")
      .select(
        "id, phrase_kr, reading, translation, usage_note, category, owner_user_id",
        { count: "exact" },
      )
      .order("phrase_kr", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .is("owner_user_id", null);
    if (debouncedQuery) {
      q = q.ilike("phrase_kr", `%${escapeLike(debouncedQuery)}%`);
    }
    if (category) q = q.eq("category", category);
    return q;
  }, [debouncedQuery, category, page]);

  const {
    rows: phrases,
    totalCount,
    loading,
    error,
    retry,
  } = usePagedQuery<Phrase>({ cacheKey: fetchKey, label: "PhraseList", run });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = Boolean(debouncedQuery) || Boolean(category);
  const showEmpty = !loading && !error && phrases.length === 0;

  return (
    <div className={styles.root}>
      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Фраза на корейском…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          autoComplete="off"
          aria-label="Поиск по фразам"
        />
        <div className={styles.categorySelect}>
          <Select
            value={category}
            aria-label="Категория"
            onChange={(value) => {
              setCategory(value);
              setPage(1);
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
          {hasFilters ? "Ничего не найдено" : "Фраз пока нет"}
        </p>
      )}

      {!loading && phrases.length > 0 && (
        <>
          <ul className={styles.results}>
            {phrases.map((phrase) => (
              <li key={phrase.id}>
                <PhraseCard phrase={phrase} />
              </li>
            ))}
          </ul>

          <nav className={styles.pagination} aria-label="Страницы">
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
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
                  onClick={() => setPage(item)}
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
              onClick={() => setPage(Math.min(totalPages, page + 1))}
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
