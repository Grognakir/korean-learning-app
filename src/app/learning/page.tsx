import Link from "next/link";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import styles from "./learning.module.css";

const MODES = [
  {
    href: "/learning/programs",
    title: "Программы",
    description: "Учебники и уроки по программе обучения — шаг за шагом.",
    image: "/images/learning/programs.png",
  },
  {
    href: "/learning/trainers",
    title: "Тренажёры",
    description: "Отработка и повторение — тренировки без привязки к уроку.",
    image: "/images/learning/trainers.png",
  },
];

export default async function LearningPage() {
  const { username } = await getLearningContext();

  return (
    <div className={styles.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={styles.wrap}>
        <h1 className={styles.title}>Обучение</h1>
        <div className={styles.modeGrid}>
          {MODES.map((mode) => (
            <Link key={mode.href} href={mode.href === "/learning/programs" && username === null ? "/login" : mode.href} className={styles.modeCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mode.image} alt="" className={styles.modeCardImage} />
              <div className={styles.modeCardBody}>
                <span className={`${styles.modeCardTitle} kr`}>{mode.title}</span>
                <p className={styles.modeCardDescription}>{mode.description}{mode.href === "/learning/programs" && username === null ? " Доступно после входа." : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
