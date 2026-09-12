import Link from "next/link";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import styles from "../learning.module.css";

export default async function TrainersPage() {
  const { username, activeLanguage } = await getLearningContext();

  return (
    <div className={styles.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}

      <main className={styles.wrap}>
        <Link href="/learning" className={styles.backLink}>
          ← Назад
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Тренажёры</h1>
        </div>

        <p className={styles.modeCardDescription}>Выберите, что хотите потренировать: память, написание или грамматику.</p>
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
                Вспоминайте перевод или слово, оценивайте ответ и закрепляйте
                его с помощью интервальных повторений.
              </p>
            </div>
          </Link>
          <Link href="/learning/trainers/pairs" className={styles.modeCard}>
            <div className={styles.modeCardPreview} aria-hidden="true">{activeLanguage === "ko" ? "가 ↔ А" : "A ↔ А"}</div>
            <div className={styles.modeCardBody}><span className={styles.modeCardTitle}>Найди пары</span><p className={styles.modeCardDescription}>Соединяйте слова с переводами: 3 раунда по 4 пары.</p></div>
          </Link>
          <Link href="/learning/trainers/spelling" className={styles.modeCard}>
            <div className={styles.modeCardPreview} aria-hidden="true">{activeLanguage === "ko" ? "가 + 나" : "A + B"}</div>
            <div className={styles.modeCardBody}><span className={styles.modeCardTitle}>Собери слово</span><p className={styles.modeCardDescription}>Составляйте слова из букв или слогов. Подсказки и повтор сложных слов.</p></div>
          </Link>
          {activeLanguage === "ko" && (
            <Link href="/learning/trainers/grammar" className={styles.modeCard}>
              <div className={`${styles.modeCardPreview} kr`} aria-hidden="true">문법</div>
              <div className={styles.modeCardBody}><span className={styles.modeCardTitle}>Грамматика</span><p className={styles.modeCardDescription}>Правило, сразу практика, смешанные задания и блиц на время.</p></div>
            </Link>
          )}
          {activeLanguage === "ko" && (
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
                  Тесты по грамматике и лексике с разбором ответов и повторением ошибок.
                </p>
              </div>
            </Link>
          )}
        </div>
      </main>

      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
