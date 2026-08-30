import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Обходит RLS через service_role — только для операций, которые обязаны
 * это делать (генерация signed URL на файлы учебника, доступные любому
 * залогиненному, см. 0-mvp.md/§"Разделение ключей Supabase"). Проверка
 * самой сессии пользователя (нужен ли ему доступ вообще) — отдельно,
 * обычным клиентом, до вызова этого файла.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
