/**
 * Адрес сайта для ссылок в письмах. В production берётся из
 * NEXT_PUBLIC_SITE_URL: заголовок Origin присылает клиент, и подставлять
 * его в ссылку подтверждения нельзя. Без настройки в production берётся
 * хост запроса; вне production допустим и Origin.
 */
export function siteOrigin(requestHeaders: Pick<Headers, "get">): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    // Без настройки не ломаем регистрацию: берём хост запроса, а не
    // присланный клиентом Origin.
    console.warn("NEXT_PUBLIC_SITE_URL не задан, ссылка подтверждения строится по хосту запроса");
    return `https://${requestHeaders.get("host")}`;
  }
  return requestHeaders.get("origin") ?? `http://${requestHeaders.get("host")}`;
}
