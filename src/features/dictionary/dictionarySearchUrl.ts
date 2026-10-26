export type DictionaryTab = "words" | "phrases" | "grammar";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseDictionaryTab(
  value: string | string[] | undefined,
): DictionaryTab {
  const tab = firstParam(value);
  if (tab === "phrases" || tab === "grammar") return tab;
  return "words";
}

export function parseDictionaryQuery(
  value: string | string[] | undefined,
): string {
  return firstParam(value);
}

export function dictionaryPageUrl(tab: DictionaryTab, query: string): string {
  const params = new URLSearchParams();
  if (tab !== "words") params.set("tab", tab);
  if (tab === "grammar" && query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/dictionary?${qs}` : "/dictionary";
}

export function replaceDictionaryUrl(tab: DictionaryTab, query: string): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", dictionaryPageUrl(tab, query));
}
