/** Сессия стикера в sessionStorage: переживает перезагрузку страницы, но не
 * закрытие вкладки. Открытое окно и ход игры нужны, чтобы после перезагрузки
 * игра не сворачивалась и не начиналась заново. */

const TTL_MS = 30 * 60 * 1000;

const openKey = (trainer: string) => `lesson-sticker:open:${trainer}`;
const gameKey = (trainer: string) => `lesson-sticker:session:${trainer}`;

function read(key: string): unknown {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // приватный режим или запрет хранилища — игра просто не восстановится
  }
}

function remove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {}
}

/** Окно было открыто на этой же странице недавно. */
export function wasOpen(trainer: string): boolean {
  const saved = read(openKey(trainer));
  if (!saved || typeof saved !== "object") return false;
  const { path, at } = saved as { path?: unknown; at?: unknown };
  return path === window.location.pathname && typeof at === "number" && Date.now() - at < TTL_MS;
}

export function markOpen(trainer: string): void {
  write(openKey(trainer), { path: window.location.pathname, at: Date.now() });
}

/** Игрок закрыл окно сам — следующий запуск начинается заново. */
export function markClosed(trainer: string): void {
  remove(openKey(trainer));
  remove(gameKey(trainer));
}

export function readGame(trainer: string): unknown {
  return read(gameKey(trainer));
}

export function writeGame(trainer: string, snapshot: unknown): void {
  write(gameKey(trainer), snapshot);
}
