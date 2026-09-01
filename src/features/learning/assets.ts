import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Подписанные URL на файлы в приватном bucket textbook-assets. Вызывается
 * только после проверки сессии на уровне страницы (см. app/learning) —
 * сам факт, что ссылки вообще генерируются, и есть точка, где гость
 * не получает доступ к материалу. Файлы, которых ещё нет (например,
 * аудио для неимпортированного урока), получают null — рендер блока в
 * этом случае просто показывает заглушку, не падает.
 *
 * Подписываем пакетом: на странице урока с галереей десятки файлов, и
 * по запросу на каждый — заметная задержка рендера.
 */
export async function getSignedAssetUrls(
  paths: string[],
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  const unique = Array.from(new Set(paths));
  if (unique.length === 0) return result;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("textbook-assets")
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    for (const path of unique) result.set(path, null);
    return result;
  }

  for (const item of data) {
    result.set(item.path ?? "", item.error ? null : item.signedUrl);
  }
  for (const path of unique) {
    if (!result.has(path)) result.set(path, null);
  }
  return result;
}
