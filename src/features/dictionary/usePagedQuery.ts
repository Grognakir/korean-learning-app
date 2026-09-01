"use client";

import { useCallback, useEffect, useState } from "react";

export type PagedEntry<T> = { rows: T[]; totalCount: number };

/**
 * Внешний кэш результатов (см. DictionaryCacheContext). `generation`
 * растёт при сбросе кэша — это сигнал перезапросить данные.
 */
export type PagedCache<T> = {
  get: (key: string) => PagedEntry<T> | undefined;
  set: (key: string, entry: PagedEntry<T>) => void;
  generation: number;
};

type QueryResult = {
  data: unknown[] | null;
  count: number | null;
  error: { message: string } | null;
};

type Options<T> = {
  /** Ключ запроса: и ключ кэша, и признак «фильтры сменились». */
  cacheKey: string;
  /** Префикс для console.error. */
  label: string;
  /** Мемоизированный по тем же зависимостям, что и cacheKey. */
  run: () => PromiseLike<QueryResult>;
  cache?: PagedCache<T>;
};

/**
 * Общий каркас постраничных списков словаря: запрос с count, состояния
 * загрузки и ошибки, ретрай и опциональный внешний кэш.
 *
 * Ошибка намеренно не попадает в кэш: раньше сбойный запрос клался туда
 * как пустой результат, пользователь видел «Слов пока нет», и повторно
 * данные не запрашивались до сброса кэша.
 */
export function usePagedQuery<T>({ cacheKey, label, run, cache }: Options<T>) {
  const [result, setResult] = useState<(PagedEntry<T> & { key: string }) | null>(
    null,
  );
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(
    null,
  );
  const [retryTick, setRetryTick] = useState(0);

  const generation = cache?.generation ?? 0;
  const cacheGet = cache?.get;
  const cacheSet = cache?.set;

  useEffect(() => {
    if (cacheGet?.(cacheKey)) return;

    let cancelled = false;

    const fail = (message: string) => {
      if (cancelled) return;
      console.error(`${label}:`, message);
      setFailure({ key: cacheKey, message });
    };

    // Обрыв сети приходит не полем error, а отказом промиса — без
    // catch список навсегда оставался бы в состоянии «Загружаем…».
    Promise.resolve(run()).then(({ data, count, error }) => {
      if (cancelled) return;
      if (error) {
        fail(error.message);
        return;
      }
      const entry: PagedEntry<T> = {
        rows: (data ?? []) as T[],
        totalCount: count ?? 0,
      };
      cacheSet?.(cacheKey, entry);
      setFailure(null);
      setResult({ ...entry, key: cacheKey });
    }, (e: unknown) => fail(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
    };
  }, [cacheKey, label, run, cacheGet, cacheSet, generation, retryTick]);

  const retry = useCallback(() => {
    setFailure(null);
    setRetryTick((n) => n + 1);
  }, []);

  const entry =
    cacheGet?.(cacheKey) ?? (result?.key === cacheKey ? result : null);
  const error = failure?.key === cacheKey ? failure.message : null;

  return {
    rows: entry?.rows ?? [],
    totalCount: entry?.totalCount ?? 0,
    loading: !entry && !error,
    error,
    retry,
  };
}
