import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Подписанный URL на файл в приватном bucket textbook-assets. Вызывается
 * только после проверки сессии на уровне страницы (см. app/learning) —
 * сам факт, что ссылка вообще генерируется, и есть точка, где гость
 * не получает доступ к материалу. Возвращает null, если файла ещё нет
 * (например, аудио/иллюстрация для урока, который ещё не импортирован) —
 * рендер блока в этом случае просто показывает заглушку, не падает.
 */
export async function getSignedAssetUrl(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("textbook-assets")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}
