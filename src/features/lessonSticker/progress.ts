const key = (trainer: string) => `lesson-sticker:${trainer}:v1`;
const EVENT = "lesson-sticker-progress";

export function readProgress(trainer: string): string[] {
  try {
    const raw = window.localStorage.getItem(key(trainer));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeProgress(trainer: string, done: string[]): void {
  try {
    window.localStorage.setItem(key(trainer), JSON.stringify(done));
  } catch {
    // приватный режим или запрет хранилища — прогресс просто не сохранится
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeProgress(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
