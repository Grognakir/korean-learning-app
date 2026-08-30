"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PART_OF_SPEECH_LABELS,
  partOfSpeechLabel,
  partOfSpeechVariant,
} from "@/features/dictionary/partOfSpeechLabels";
import {
  PART_OF_SPEECH_TAGS,
  type CategoryOption,
  type PartOfSpeech,
  type Word,
} from "@/features/dictionary/types";
import { Select } from "@/components/ui/Select";
import styles from "./WordList.module.css";

const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_DIR = "asc" as const;

type Ownership = "all" | "global" | "mine";

function FilterIcon() {
  return (
    <svg
      className={styles.filterIcon}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 3.5h12M4.5 8h7M6.5 12.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg
      className={styles.filterIcon}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 5h11M2.5 11h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="5" r="2" fill="currentColor" />
      <circle cx="10.5" cy="11" r="2" fill="currentColor" />
    </svg>
  );
}

type WordListProps = {
  categories: CategoryOption[];
  userId: string | null;
  refreshKey?: number;
};

function formatReading(reading: string): string {
  return reading
    .replace(/[/|,;]+/g, " ")
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const POS_DUPLICATE_CATEGORIES = new Set([
  "Местоимения",
  "Вопросительные слова",
  "Числительные",
  "Частицы",
  "Союзы и связки",
  "Соединительные окончания",
  "Счётные слова",
  "Глаголы",
  "Прилагательные",
]);

const RELATION_LABELS = new Set(["антоним", "синоним"]);

function WordCard({
  word,
  expanded,
  onToggle,
}: {
  word: Word;
  expanded: boolean;
  onToggle: () => void;
}) {
  const translations = word.translations.map((t) => t.text).join(", ");
  const categoryNames = word.word_categories
    .map((wc) => wc.categories?.name)
    .filter(Boolean) as string[];
  const visibleCategoryNames = categoryNames.filter(
    (name) => !POS_DUPLICATE_CATEGORIES.has(name),
  );
  const posLabel = partOfSpeechLabel(word.part_of_speech);
  const posVariant = partOfSpeechVariant(word.part_of_speech);
  const reading = word.reading ? formatReading(word.reading) : "";
  const relatedWords = word.word_forms.filter((f) =>
    RELATION_LABELS.has(f.label ?? ""),
  );
  const realForms = word.word_forms.filter(
    (f) => !RELATION_LABELS.has(f.label ?? ""),
  );
  const showNotesDivider = word.word_notes.length > 0 && relatedWords.length > 0;
  const lastNoteRef = useRef<HTMLSpanElement>(null);
  const [dividerWidth, setDividerWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (expanded && showNotesDivider && lastNoteRef.current) {
      setDividerWidth(lastNoteRef.current.getBoundingClientRect().width);
    }
  }, [expanded, showNotesDivider, word.id]);

  const hasDetails =
    word.word_examples.length > 0 ||
    word.word_notes.length > 0 ||
    realForms.length > 0 ||
    relatedWords.length > 0 ||
    visibleCategoryNames.length > 0 ||
    Boolean(posLabel);

  const details = expanded && hasDetails && (
    <div className={styles.details}>
      {(posLabel || visibleCategoryNames.length > 0) && (
        <div className={styles.categoryChips}>
          {posLabel && (
            <span
              className={`${styles.posChip} ${
                posVariant === "grammar"
                  ? styles.posChipGrammar
                  : styles.posChipContent
              }`}
            >
              {posLabel}
            </span>
          )}
          {visibleCategoryNames.map((name) => (
            <span key={name} className={styles.categoryChip}>
              {name}
            </span>
          ))}
        </div>
      )}
      {word.word_examples.length > 0 && (
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Примеры</span>
          <ul className={styles.examples}>
            {word.word_examples.map((ex, i) => (
              <li key={i} className={styles.example}>
                <span className="kr">{ex.kr}</span>
                <span className={styles.exampleRu}>{ex.ru}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(word.word_notes.length > 0 || relatedWords.length > 0) && (
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Примечания</span>
          <ul className={styles.notes}>
            {word.word_notes.map((note, i) => {
              const isLast = i === word.word_notes.length - 1;
              return (
                <li key={i}>
                  {isLast && showNotesDivider ? (
                    <span ref={lastNoteRef}>{note.text}</span>
                  ) : (
                    note.text
                  )}
                </li>
              );
            })}
            {showNotesDivider && (
              <li className={styles.notesDivider} aria-hidden="true">
                <span
                  className={styles.notesDividerLine}
                  style={dividerWidth ? { width: `${dividerWidth}px` } : undefined}
                />
              </li>
            )}
            {relatedWords.map((rel, i) => {
              const glossIndex = rel.value.indexOf(" (");
              const relWord =
                glossIndex === -1 ? rel.value : rel.value.slice(0, glossIndex);
              const gloss =
                glossIndex === -1 ? "" : rel.value.slice(glossIndex + 1);
              return (
                <li key={`rel-${i}`}>
                  <span className="kr">{word.headword}</span>{" "}
                  {rel.label === "антоним" ? "↔" : "="}{" "}
                  <span className="kr">{relWord}</span>
                  {gloss && ` ${gloss}`}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {realForms.length > 0 && (
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Формы</span>
          <ul className={styles.forms}>
            {realForms.map((form, i) => (
              <li key={i}>
                {form.label && <span>{form.label}: </span>}
                <span className={`${styles.formValue} kr`}>{form.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const body = (
    <>
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <span className={`${styles.headword} kr`}>{word.headword}</span>
          {reading && <span className={styles.reading}>{reading}</span>}
        </div>
        {translations && (
          <p className={styles.translations}>{translations}</p>
        )}
      </div>
      {hasDetails && (
        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      )}
    </>
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
        </button>
      ) : (
        <div className={styles.cardHeader}>{body}</div>
      )}
      {details}
    </article>
  );
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([
    1,
    2,
    3,
    total,
    current,
    current - 1,
    current + 1,
  ]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

export function WordList({ categories, userId, refreshKey = 0 }: WordListProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(DEFAULT_SORT_DIR);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [ownership, setOwnership] = useState<Ownership>("all");
  const [openPanel, setOpenPanel] = useState<"filters" | "view" | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [resolvedFetchKey, setResolvedFetchKey] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!openPanel) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (filtersRef.current && !filtersRef.current.contains(target)) {
        if (target.closest("[data-select-menu]")) return;
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openPanel]);

  const fetchKey = useMemo(
    () =>
      JSON.stringify({
        debouncedQuery,
        sortDir,
        pageSize,
        page,
        partOfSpeech,
        categoryId,
        ownership,
        userId,
        refreshKey,
      }),
    [
      debouncedQuery,
      sortDir,
      pageSize,
      page,
      partOfSpeech,
      categoryId,
      ownership,
      userId,
      refreshKey,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    const embed = categoryId
      ? "word_categories!inner(categories!inner(id, name))"
      : "word_categories(categories(id, name))";

    const supabase = createClient();
    let q = supabase
      .from("words")
      .select(
        `id, headword, reading, part_of_speech, owner_user_id, translations(text), ${embed}, word_examples(kr, ru), word_notes(text), word_forms(label, value)`,
        { count: "exact" },
      )
      .order("headword", { ascending: sortDir === "asc" })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (debouncedQuery) q = q.ilike("headword", `%${debouncedQuery}%`);
    if (partOfSpeech) q = q.eq("part_of_speech", partOfSpeech);
    if (categoryId) q = q.eq("word_categories.category_id", categoryId);
    if (ownership === "global") q = q.is("owner_user_id", null);
    if (ownership === "mine" && userId) q = q.eq("owner_user_id", userId);

    q.then(({ data, count, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("WordList:", error.message);
        setWords([]);
        setTotalCount(0);
      } else {
        setWords((data ?? []) as unknown as Word[]);
        setTotalCount(count ?? 0);
      }
      setResolvedFetchKey(fetchKey);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, categoryId, debouncedQuery, ownership, page, pageSize, partOfSpeech, sortDir, userId]);

  const loading = fetchKey !== resolvedFetchKey;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasListFilters =
    Boolean(debouncedQuery) ||
    Boolean(partOfSpeech) ||
    Boolean(categoryId) ||
    ownership !== "all";
  const activeFilterCount =
    Number(Boolean(partOfSpeech)) +
    Number(Boolean(categoryId)) +
    Number(ownership !== "all");
  const hasNonDefaultFilters =
    Boolean(partOfSpeech) || Boolean(categoryId) || ownership !== "all";
  const hasNonDefaultView =
    sortDir !== DEFAULT_SORT_DIR || pageSize !== DEFAULT_PAGE_SIZE;
  const showEmpty =
    !loading && words.length === 0 && fetchKey === resolvedFetchKey;

  const resetPage = () => setPage(1);

  const resetFilters = () => {
    setPartOfSpeech("");
    setCategoryId("");
    setOwnership("all");
    resetPage();
  };

  const resetView = () => {
    setSortDir(DEFAULT_SORT_DIR);
    setPageSize(DEFAULT_PAGE_SIZE);
    resetPage();
  };

  const togglePanel = (panel: "filters" | "view") => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <div className={styles.root}>
      <div ref={filtersRef}>
        <div className={styles.searchRow}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Слово на корейском…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setExpandedId(null);
              resetPage();
            }}
            autoComplete="off"
            aria-label="Поиск по словарю"
          />
          <button
            type="button"
            className={
              openPanel === "filters"
                ? styles.filtersToggleActive
                : styles.filtersToggle
            }
            onClick={() => togglePanel("filters")}
            aria-expanded={openPanel === "filters"}
            aria-controls="dictionary-filters-panel"
            aria-label={
              activeFilterCount > 0
                ? `Фильтры, выбрано ${activeFilterCount}`
                : "Фильтры"
            }
          >
            <FilterIcon />
            {activeFilterCount > 0 && (
              <span className={styles.filtersBadge} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={
              openPanel === "view"
                ? styles.filtersToggleActive
                : styles.filtersToggle
            }
            onClick={() => togglePanel("view")}
            aria-expanded={openPanel === "view"}
            aria-controls="dictionary-view-panel"
            aria-label="Показ"
          >
            <ViewIcon />
          </button>
        </div>

        {openPanel === "filters" && (
          <div
            id="dictionary-filters-panel"
            className={styles.filtersPanel}
          >
            <div className={styles.filtersGrid}>
              <label className={styles.filterField}>
                <span className={styles.filterLabel}>Часть речи</span>
                <Select
                  aria-label="Часть речи"
                  value={partOfSpeech}
                  onChange={(v) => {
                    setPartOfSpeech(v as PartOfSpeech | "");
                    resetPage();
                  }}
                  options={[
                    { value: "", label: "Все" },
                    ...PART_OF_SPEECH_TAGS.map((tag) => ({
                      value: tag,
                      label: PART_OF_SPEECH_LABELS[tag],
                    })),
                  ]}
                />
              </label>

              <label className={styles.filterField}>
                <span className={styles.filterLabel}>Источник</span>
                <Select
                  aria-label="Источник"
                  value={ownership}
                  onChange={(v) => {
                    setOwnership(v as Ownership);
                    resetPage();
                  }}
                  options={[
                    { value: "all", label: "Все слова" },
                    { value: "global", label: "Общие" },
                    ...(userId ? [{ value: "mine", label: "Мои" }] : []),
                  ]}
                />
              </label>

              <label className={styles.filterFieldWide}>
                <span className={styles.filterLabel}>Категория</span>
                <Select
                  aria-label="Категория"
                  value={categoryId}
                  onChange={(v) => {
                    setCategoryId(v);
                    resetPage();
                  }}
                  options={[
                    { value: "", label: "Все" },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                />
              </label>
            </div>

            {hasNonDefaultFilters && (
              <button
                type="button"
                className={styles.resetFilters}
                onClick={resetFilters}
              >
                Сбросить
              </button>
            )}
          </div>
        )}

        {openPanel === "view" && (
          <div id="dictionary-view-panel" className={styles.filtersPanel}>
            <div className={styles.viewGrid}>
              <label className={styles.filterField}>
                <span className={styles.filterLabel}>Сортировка</span>
                <Select
                  aria-label="Сортировка"
                  value={sortDir}
                  onChange={(v) => {
                    setSortDir(v as "asc" | "desc");
                    resetPage();
                  }}
                  options={[
                    { value: "asc", label: "А → Я" },
                    { value: "desc", label: "Я → А" },
                  ]}
                />
              </label>

              <label className={styles.filterField}>
                <span className={styles.filterLabel}>Количество слов</span>
                <Select
                  aria-label="Количество слов"
                  value={String(pageSize)}
                  onChange={(v) => {
                    setPageSize(Number(v));
                    resetPage();
                  }}
                  options={PAGE_SIZE_OPTIONS.map((size) => ({
                    value: String(size),
                    label: String(size),
                  }))}
                />
              </label>
            </div>

            {hasNonDefaultView && (
              <button
                type="button"
                className={styles.resetFilters}
                onClick={resetView}
              >
                Сбросить
              </button>
            )}
          </div>
        )}
      </div>

      {loading && <p className={styles.hint}>Загружаем…</p>}

      {showEmpty && (
        <p className={styles.hint}>
          {hasListFilters ? "Ничего не найдено" : "Слов пока нет"}
        </p>
      )}

      {!loading && words.length > 0 && (
        <>
          <ul className={styles.results}>
            {words.map((word) => (
              <li key={word.id}>
                <WordCard
                  word={word}
                  expanded={expandedId === word.id}
                  onToggle={() =>
                    setExpandedId((id) => (id === word.id ? null : word.id))
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
