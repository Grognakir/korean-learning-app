import Link from "next/link";
import { requireUserWithProfile } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import styles from "../learning.module.css";

export default async function TrainersPage() {
  const { username } = await requireUserWithProfile();

  return (
    <div className={styles.page}>
      <AppHeader username={username} />

      <main className={styles.wrap}>
        <Link href="/learning" className={styles.backLink}>
          ← Назад
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Тренажёры</h1>
        </div>

        <div className={styles.modeGrid}>
          <Link href="/learning/trainers/flashcards" className={styles.modeCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/learning/trainers.jpg"
              alt=""
              className={styles.modeCardImage}
            />
            <div className={styles.modeCardBody}>
              <span className={`${styles.modeCardTitle} kr`}>Карточки слов</span>
              <p className={styles.modeCardDescription}>
                Карточки как в Anki/Quizlet — слово нужно вспомнить, оценить и
                повторить по расписанию.
              </p>
            </div>
          </Link>
          <Link href="/learning/trainers/topics" className={styles.modeCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/learning/topics.jpg"
              alt=""
              className={styles.modeCardImage}
            />
            <div className={styles.modeCardBody}>
              <span className={`${styles.modeCardTitle} kr`}>Отработка тем</span>
              <p className={styles.modeCardDescription}>
                Тесты с выбором ответа по конкретным темам грамматики и лексики.
              </p>
            </div>
          </Link>
        </div>
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
