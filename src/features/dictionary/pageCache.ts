import type { PagedEntry } from "./usePagedQuery";

export type PageResult = { data: unknown[] | null; count: number | null; error: { message: string } | null };

export function createPageCache() {
  const entries = new Map<string, PagedEntry<unknown>>();
  const pending = new Map<string, Promise<PageResult>>();
  let generation = 0;
  const set = <T,>(key: string, entry: PagedEntry<T>) => {
    entries.delete(key);
    entries.set(key, entry);
    if (entries.size > 24) entries.delete(entries.keys().next().value!);
  };
  return {
    get: <T,>(key: string) => entries.get(key) as PagedEntry<T> | undefined,
    set,
    clear: () => { generation++; entries.clear(); pending.clear(); },
    request: (key: string, run: () => PromiseLike<PageResult>): Promise<PageResult> => {
      const cached = entries.get(key);
      if (cached) return Promise.resolve({ data: cached.rows, count: cached.totalCount, error: null });
      const current = pending.get(key);
      if (current) return current;
      const version = generation;
      const task = Promise.resolve().then(run).then((result) => {
        if (version === generation && !result.error) set(key, { rows: result.data ?? [], totalCount: result.count ?? 0 });
        return result;
      }).finally(() => { if (pending.get(key) === task) pending.delete(key); });
      pending.set(key, task);
      return task;
    },
  };
}
