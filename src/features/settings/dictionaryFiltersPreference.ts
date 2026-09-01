const STORAGE_KEY = "korean-app:preserve-dictionary-filters";
const CHANGE_EVENT = "korean-app:preserve-dictionary-filters";

export function getPreserveDictionaryFilters(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) !== "false";
}

export function setPreserveDictionaryFilters(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribePreserveDictionaryFilters(
  onChange: () => void,
): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
