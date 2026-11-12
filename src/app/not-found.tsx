import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import buttons from "@/components/ui/Button.module.css";
import { displayName, getAuthUser, getProfileRow } from "@/features/auth/requireUser";
import styles from "./error.module.css";

export default async function NotFound() {
  const { user } = await getAuthUser();
  const profile = user ? await getProfileRow(user.id) : null;

  return (
    <>
      {user ? <AppHeader username={displayName(profile, user)} /> : <GuestHeader />}
      <main className={styles.wrap}>
        <p className={styles.title}>Страница не найдена</p>
        <p className={styles.subtitle}>Возможно, адрес набран с ошибкой или страница переехала.</p>
        <div className={styles.actions}>
          <Link href="/learning" className={buttons.primary}>
            К обучению
          </Link>
          <Link href="/dictionary" className={buttons.secondary}>
            В словарь
          </Link>
        </div>
      </main>
      <BottomTabBar />
    </>
  );
}
