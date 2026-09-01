import Link from "next/link";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { TOPICS } from "@/features/trainers/topics/types";
import layout from "../../learning.module.css";
import styles from "./topics.module.css";

export default async function TopicsPage() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: counts }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase.from("topic_quiz_questions").select("topic"),
  ]);
  const username = displayName(profile, user);

  const countByTopic = new Map<string, number>();
  for (const row of counts ?? []) {
    countByTopic.set(row.topic, (countByTopic.get(row.topic) ?? 0) + 1);
  }

  return (
    <div className={layout.page}>
      <AppHeader username={username} />
      <main className={layout.wrap}>
        <Link href="/learning/trainers" className={layout.backLink}>
          ← Назад
        </Link>
        <h1 className={layout.title}>Отработка тем</h1>
        <div className={styles.sectionGrid}>
          {TOPICS.map((topic) => (
            <Link
              key={topic.key}
              href={`/learning/trainers/topics/${topic.key}`}
              className={styles.sectionCard}
            >
              <span className={styles.sectionCardTitle}>{topic.label}</span>
              <span className={styles.sectionCardMeta}>
                {countByTopic.get(topic.key) ?? 0} вопросов
              </span>
            </Link>
          ))}
        </div>
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
