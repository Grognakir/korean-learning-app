import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { devSignIn } from "@/features/auth/actions";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { WordOverviewCard } from "@/features/dashboard/WordOverviewCard";
import { getWordOverview } from "@/features/dashboard/wordOverview";
import buttons from "@/components/ui/Button.module.css";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { getActiveLanguage } from "@/features/language/getActiveLanguage";
import styles from "./page.module.css";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const guestLanguage = await getActiveLanguage();

    return (
      <div className={styles.page}>
        <GuestHeader />

        <main className={styles.guestMain}>
          <div className={styles.guestIntro}>
            <h1 className={styles.title}>{guestLanguage === "ko" ? "한국어 공부" : "English Study"}</h1>
            <p className={styles.subtitle}>
              {guestLanguage === "ko" ? "Приложение для изучения корейского" : "Приложение для изучения английского"}
            </p>
          </div>

          <LanguageSwitch initialLanguage={guestLanguage} size="lg" />

          <Link href="/dictionary" className={styles.dictionaryCard}>
            <div className={styles.taegeukEdge} />
            <div className={styles.dictionaryCardBody}>
              <h2 className={styles.cardTitle}>Открыть словарь</h2>
              <p className={styles.dictionaryCardText}>
                {guestLanguage === "ko"
                  ? "Слова, фразы и грамматика — можно смотреть и искать без регистрации."
                  : "Английские слова и примеры — можно смотреть и искать без регистрации."}
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
  const overview = await getWordOverview(supabase, user.id, activeLanguage);

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.main}>
        <div className={styles.greetingRow}>
          <p className={styles.greeting}>Привет, {username} 👋</p>
        </div>

        <LanguageSwitch initialLanguage={activeLanguage} size="lg" />

        <WordOverviewCard overview={overview} />

        <section className={styles.planCard}>
          <p className={styles.planText}>
            {activeLanguage === "ko" ? "Учебные материалы и упражнения" : "Пополняйте словарь для следующих тренировок"}
          </p>
          <Link
            href={activeLanguage === "ko" ? "/learning/plans" : "/dictionary"}
            className={`${buttons.secondary} ${styles.actionLink}`}
          >
            {activeLanguage === "ko" ? "Открыть уроки" : "Открыть словарь"}
          </Link>
        </section>
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
