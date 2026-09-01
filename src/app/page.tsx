import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { devSignIn } from "@/features/auth/actions";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { Button } from "@/components/ui/Button";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { SegmentedProgressBar } from "@/components/ui/SegmentedProgressBar";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { getActiveLanguage } from "@/features/language/getActiveLanguage";
import styles from "./page.module.css";

/**
 * Мок-данные для визуальной проверки макета из
 * docs/dev_docs/design/0-dashboard-home.md. Стрик и счётчики SRS требуют
 * агрегатов по review_events/progress (Roadmap п.5, 0-mvp.md), план обучения —
 * данных фазы 2 (3-dictionary-and-learning.md) — ни то ни другое ещё не
 * реализовано, поэтому здесь заглушки, а не запросы к БД.
 */
const MOCK = {
  streakDays: 5,
  wordsLearned: 84,
  wordsLearning: 23,
  wordsAvailable: 41,
  dueToday: 12,
  plan: { title: "인하대학교", level: "2급", lesson: 5 },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className={styles.page}>
        <GuestHeader />

        <main className={styles.wrap}>
          <div className={styles.panel}>
            <h1 className={styles.title}>한국어 공부</h1>
            <p className={styles.subtitle}>
              Приложение для изучения корейского
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

        <BottomTabBar sections={NAV_SECTIONS} />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? user.email ?? "Пользователь";
  const activeLanguage = await getActiveLanguage();

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.main}>
        <div className={styles.greetingRow}>
          <p className={styles.greeting}>Привет, {username} 👋</p>
          <StreakBadge days={MOCK.streakDays} />
        </div>

        <LanguageSwitch initialLanguage={activeLanguage} size="lg" />

        <section className={styles.wordsCard}>
          <div className={styles.taegeukEdge} />
          <div className={styles.wordsCardBody}>
            <h2 className={styles.cardTitle}>Слова</h2>
            <SegmentedProgressBar
              segments={[
                {
                  label: "изучено",
                  value: MOCK.wordsLearned,
                  colorVar: "--green",
                },
                {
                  label: "изучается",
                  value: MOCK.wordsLearning,
                  colorVar: "--blue",
                },
                {
                  label: "доступно",
                  value: MOCK.wordsAvailable,
                  colorVar: "--stone",
                },
              ]}
            />
            <p className={styles.dueCount}>
              К повторению сегодня: <strong>{MOCK.dueToday}</strong>
            </p>
            <Button
              variant="primary"
              disabled
              title="Заглушка — SRS-флоу флэшкарт ещё не реализован"
            >
              Повторять
            </Button>
          </div>
        </section>

        <section className={styles.planCard}>
          <p className={styles.planText}>
            План {MOCK.plan.title} · {MOCK.plan.level}, {MOCK.plan.lesson}과
          </p>
          <Button
            variant="secondary"
            disabled
            title="Заглушка — раздел «Обучение» ещё не реализован"
          >
            Продолжить
          </Button>
        </section>
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
