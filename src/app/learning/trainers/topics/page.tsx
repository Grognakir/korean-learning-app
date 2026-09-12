import Link from "next/link";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { plural } from "@/lib/plural";
import { TOPICS } from "@/features/trainers/topics/types";
import { TrainerHeader } from "@/features/trainers/components/TrainerHeader";
import layout from "../../learning.module.css";
import styles from "./topics.module.css";

export default async function TopicsPage() {
  const { supabase, username } = await getLearningContext();

  const { data: counts, error } = await supabase.from("topic_quiz_questions").select("topic");
  if (error) throw new Error("Не удалось загрузить темы");

  const countByTopic = new Map<string, number>();
  for (const row of counts ?? []) {
    countByTopic.set(row.topic, (countByTopic.get(row.topic) ?? 0) + 1);
  }

  return (
    <div className={layout.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={layout.wrap}>
        <TrainerHeader href="/learning/trainers" title="Отработка тем" backLabel="К тренажёрам" />
        <div className={styles.sectionGrid}>
          {TOPICS.map((topic) => (
            <Link
              key={topic.key}
              href={`/learning/trainers/topics/${topic.key}`}
              className={styles.sectionCard}
            >
              <span className={styles.sectionCardTitle}>{topic.label}</span>
              <span className={styles.sectionCardMeta}>
                {countByTopic.get(topic.key) ?? 0}{" "}
                {plural(countByTopic.get(topic.key) ?? 0, ["вопрос", "вопроса", "вопросов"])}
              </span>
            </Link>
          ))}
        </div>
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
