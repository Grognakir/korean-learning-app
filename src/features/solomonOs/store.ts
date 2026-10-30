/** Хранилище Solomon OS в браузере: localStorage с префиксом `solomon:`.
 * Если хранилище недоступно (приватный режим, запрет), данные живут в памяти
 * до перезагрузки — ОС работает, просто не запоминает состояние. */

const PREFIX = "solomon:";
const memory = new Map<string, string>();

export function load<T>(key: string, fallback: T): T {
  let raw: string | null | undefined;
  try {
    raw = window.localStorage.getItem(PREFIX + key);
  } catch {
    // хранилище недоступно — то, что сохранили за эту сессию
    raw = memory.get(key);
  }
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(PREFIX + key, raw);
  } catch {
    // остаётся в памяти
  }
}

export function remove(key: string): void {
  memory.delete(key);
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {}
}
