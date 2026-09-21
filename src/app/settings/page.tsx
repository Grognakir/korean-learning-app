import { displayName, getProfileRow, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { FontSettingsForm } from "@/features/settings/components/FontSettingsForm";
import { PreserveFiltersToggle } from "@/features/settings/components/PreserveFiltersToggle";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const { user } = await requireUser();
  const profile = await getProfileRow(user.id);

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
      <BottomTabBar />
    </div>
  );
}
