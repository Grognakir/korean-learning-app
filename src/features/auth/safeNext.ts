const BASE = "http://next.invalid";

/**
 * Безопасный путь возврата после входа. `next` приходит из адреса и формы,
 * то есть от недоверенной стороны: принимаем только относительный путь
 * того же приложения. Простой запрет «//» и «/\» недостаточен — например,
 * «/<табуляция>/host» браузер разбирает как внешний адрес, поэтому путь
 * разбирается через URL и сверяется origin.
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2000) return "/";
  if (!value.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(value)) return "/";
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
