import Link from "next/link";
import { requireUserWithProfile } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import styles from "./learning.module.css";

const MODES = [
  {
    href: "/learning/plans",
    title: "Планы",
    description: "Учебники и уроки по плану обучения — шаг за шагом.",
    image: "/images/learning/plans.jpg",
  },
  {
    href: "/learning/trainers",
    title: "Тренажёры",
    description: "Отработка и повторение — тренировки без привязки к уроку.",
    image: "/images/learning/trainers.jpg",
  },
];

export default async function LearningPage() {
  const { username } = await requireUserWithProfile();

  return (
    <div className={styles.page}>
      <AppHeader username={username} />
      <main className={styles.wrap}>
        <h1 className={styles.title}>Обучение</h1>
        <div className={styles.modeGrid}>
          {MODES.map((mode) => (
            <Link key={mode.href} href={mode.href} className={styles.modeCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mode.image} alt="" className={styles.modeCardImage} />
              <div className={styles.modeCardBody}>
                <span className={`${styles.modeCardTitle} kr`}>{mode.title}</span>
                <p className={styles.modeCardDescription}>{mode.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
