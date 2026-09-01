import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { FontSettingsForm } from "@/features/settings/components/FontSettingsForm";
import { PreserveFiltersToggle } from "@/features/settings/components/PreserveFiltersToggle";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, font_ui, font_kr")
    .eq("id", user.id)
    .single();

  return (
    <div className={styles.page}>
      <AppHeader username={displayName(profile, user)} />
      <main className={styles.wrap}>
        <h1 className={styles.title}>Настройки</h1>
        <FontSettingsForm
          initialFontUi={profile?.font_ui ?? null}
          initialFontKr={profile?.font_kr ?? null}
        />
        <PreserveFiltersToggle />
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
