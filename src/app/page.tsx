import Link from "next/link";
import { getAuthUser, getProfileRow } from "@/features/auth/requireUser";
import { devSignIn } from "@/features/auth/actions";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { WordOverviewCard } from "@/features/dashboard/WordOverviewCard";
import { getWordOverview } from "@/features/dashboard/wordOverview";
import buttons from "@/components/ui/Button.module.css";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import styles from "./page.module.css";

export default async function HomePage() {
  const { supabase, user } = await getAuthUser();

  if (!user) {
    return (
      <div className={styles.page}>
        <GuestHeader />

        <main className={styles.guestMain}>
          <div className={styles.guestIntro}>
            <h1 className={styles.title}>한국어 공부</h1>
            <p className={styles.subtitle}>Приложение для изучения корейского</p>
          </div>

          <Link href="/dictionary" className={styles.dictionaryCard}>
            <div className={styles.taegeukEdge} />
            <div className={styles.dictionaryCardBody}>
              <h2 className={styles.cardTitle}>Открыть словарь</h2>
              <p className={styles.dictionaryCardText}>
                Слова, фразы и грамматика — можно смотреть и искать без регистрации.
              </p>
            </div>
          </Link>

          <Link href="/learning" className={styles.primary}>Начать обучение</Link>

          <div className={styles.panel}>
            <p className={styles.subtitle}>
              Войдите, чтобы сохранять прогресс и учиться по планам.
            </p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.primary}>
                Войти
              </Link>
              <Link href="/register" className={styles.secondary}>
                Зарегистрироваться
              </Link>
              {process.env.NODE_ENV !== "production" && (
                <form action={devSignIn}>
                  <button type="submit" className={styles.devLogin}>
                    Логин в dev
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>

        <BottomTabBar />
      </div>
    );
  }

  const profile = await getProfileRow(user.id);

  const username = profile?.username ?? user.email ?? "Пользователь";
  const overview = await getWordOverview(supabase, user.id);

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.main}>
        <div className={styles.greetingRow}>
          <p className={styles.greeting}>Привет, {username} 👋</p>
        </div>

        <WordOverviewCard overview={overview} />

        <section className={styles.planCard}>
          <p className={styles.planText}>Учебные материалы и упражнения</p>
          <Link href="/learning/plans" className={`${buttons.secondary} ${styles.actionLink}`}>
            Открыть уроки
          </Link>
        </section>
      </main>

      <BottomTabBar />
    </div>
  );
}
