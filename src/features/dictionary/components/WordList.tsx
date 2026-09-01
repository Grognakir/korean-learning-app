"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { escapeLike } from "@/lib/supabase/escapeLike";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import {
  DEFAULT_STATE,
  useDictionaryCache,
} from "@/features/dictionary/DictionaryCacheContext";
import { formatReading } from "@/features/dictionary/formatReading";
import { buildPageNumbers } from "@/features/dictionary/pagination";
import { usePagedQuery } from "@/features/dictionary/usePagedQuery";
import { getPreserveDictionaryFilters } from "@/features/settings/dictionaryFiltersPreference";
import {
  PART_OF_SPEECH_LABELS,
  partOfSpeechLabel,
  partOfSpeechVariant,
} from "@/features/dictionary/partOfSpeechLabels";
import {
  PART_OF_SPEECH_TAGS,
  type CategoryOption,
  type Word,
} from "@/features/dictionary/types";
import { Select } from "@/components/ui/Select";
import { EditWordModal } from "./EditWordModal";
import { ListError } from "./ListError";
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
  onWordChanged: () => void;
};

function EditIcon() {
  return (
    <svg
      className={styles.editIcon}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11.2 2.8a1.6 1.6 0 0 1 2.3 2.3L6 12.6l-3 .7.7-3 7.5-7.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  onEdit,
}: {
  word: Word;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (() => void) | null;
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
      <div className={styles.cardHeaderRow}>
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
        {onEdit && (
          <button
            type="button"
            className={styles.editButton}
            onClick={onEdit}
            aria-label={`Изменить слово ${word.headword}`}
          >
            <EditIcon />
          </button>
        )}
      </div>
      {details}
    </article>
  );
}

export function WordList({ categories, userId, onWordChanged }: WordListProps) {
  const {
    state,
    setState,
    getCachedResults,
    setCachedResults,
    clearResultsCache,
    resultsGeneration,
  } = useDictionaryCache();
  const {
    query,
    sortDir,
    pageSize,
    page,
    partOfSpeech,
    categoryId,
    ownership,
    openPanel,
    expandedId,
  } = state;

  const [rawDebouncedQuery, setDebouncedQuery] = useDebouncedValue(query, 300);
  const debouncedQuery = rawDebouncedQuery.trim();
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const prevUserIdRef = useRef(userId);

  // Сброс фильтров при заходе на страницу, если пользователь не включил
  // их сохранение.
  useLayoutEffect(() => {
    if (!getPreserveDictionaryFilters()) {
      setState(DEFAULT_STATE);
      setDebouncedQuery("");
      clearResultsCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only reset
  }, []);

  useEffect(() => {
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;
    clearResultsCache();
  }, [userId, clearResultsCache]);

  useEffect(() => {
    if (!openPanel) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (filtersRef.current && !filtersRef.current.contains(target)) {
        if (target.closest("[data-select-menu]")) return;
        setState({ openPanel: null });
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openPanel, setState]);

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
    ],
  );

  const run = useCallback(() => {
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

    if (debouncedQuery) {
      q = q.ilike("headword", `%${escapeLike(debouncedQuery)}%`);
    }
    if (partOfSpeech) q = q.eq("part_of_speech", partOfSpeech);
    if (categoryId) q = q.eq("word_categories.category_id", categoryId);
    if (ownership === "global") q = q.is("owner_user_id", null);
    if (ownership === "mine" && userId) q = q.eq("owner_user_id", userId);

    return q;
  }, [
    categoryId,
    debouncedQuery,
    ownership,
    page,
    pageSize,
    partOfSpeech,
    sortDir,
    userId,
  ]);

  const cache = useMemo(
    () => ({
      get: getCachedResults,
      set: setCachedResults,
      generation: resultsGeneration,
    }),
    [getCachedResults, setCachedResults, resultsGeneration],
  );

  const {
    rows: words,
    totalCount,
    loading,
    error,
    retry,
  } = usePagedQuery<Word>({ cacheKey: fetchKey, label: "WordList", run, cache });

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
  const showEmpty = !loading && !error && words.length === 0;

  const resetFilters = () => {
    setState({
      partOfSpeech: "",
      categoryId: "",
      ownership: "all",
      page: 1,
    });
  };

  const resetView = () => {
    setState({
      sortDir: DEFAULT_SORT_DIR,
      pageSize: DEFAULT_PAGE_SIZE,
      page: 1,
    });
  };

  const togglePanel = (panel: "filters" | "view") => {
    setState({ openPanel: openPanel === panel ? null : panel });
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
              setState({ query: e.target.value, expandedId: null, page: 1 });
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
                    setState({ partOfSpeech: v, page: 1 });
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
                    setState({ ownership: v as Ownership, page: 1 });
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
                    setState({ categoryId: v, page: 1 });
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
                    setState({ sortDir: v as "asc" | "desc", page: 1 });
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
                    setState({ pageSize: Number(v), page: 1 });
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

      {error && <ListError onRetry={retry} />}

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
                    setState({
                      expandedId: expandedId === word.id ? null : word.id,
                    })
                  }
                  onEdit={
                    userId && word.owner_user_id === userId
                      ? () => setEditingWord(word)
                      : null
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
              onClick={() => setState({ page: Math.max(1, page - 1) })}
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
                  onClick={() => setState({ page: item })}
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
              onClick={() =>
                setState({ page: Math.min(totalPages, page + 1) })
              }
              aria-label="Следующая страница"
            >
              ›
            </button>
          </nav>
        </>
      )}

      <EditWordModal
        open={editingWord !== null}
        word={editingWord}
        categories={categories}
        onClose={() => setEditingWord(null)}
        onWordChanged={onWordChanged}
      />
    </div>
  );
}
