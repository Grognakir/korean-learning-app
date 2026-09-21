import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// cache() — один клиент на весь server-render (layout, page и любые
// вложенные компоненты, которые его запросят, делят один и тот же объект
// вместо создания нового на каждый вызов); держит и последующий
// auth.getUser()/getProfileRow() мемоизированными в requireUser.ts.
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // вызов из server component (не route handler/server action) —
            // запись cookie недоступна, сессию продлевает middleware
          }
        },
      },
    },
  );
});
