import Link from "next/link";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { TOPICS_LIST } from "@/features/topics/topicsList";
import styles from "./topics.module.css";

export default async function TopicsPage() {
  const { username } = await getLearningContext();

  return (
    <div className={styles.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={styles.wrap}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Темы</p>
          <h1 className={styles.title}>Разбор по темам</h1>
        </div>
        <div className={styles.grid}>
          {TOPICS_LIST.map((topic) => (
            <Link key={topic.slug} href={`/topics/${topic.slug}`} className={styles.card}>
              <span className={`${styles.cardTitle} kr`}>{topic.title}</span>
              <span className={`${styles.cardSubtitle} kr`}>{topic.subtitle}</span>
            </Link>
          ))}
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
