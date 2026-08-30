import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { DictionaryPageClient } from "@/features/dictionary/components/DictionaryPageClient";
import styles from "./dictionary.module.css";

export default async function DictionaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? user.email ?? "Пользователь";
  }

  return (
    <div className={styles.page}>
      {user ? <AppHeader username={username!} /> : <GuestHeader />}

      <main className={styles.wrap}>
        <DictionaryPageClient
          categories={categories ?? []}
          userId={user?.id ?? null}
        />
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
