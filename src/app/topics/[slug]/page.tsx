import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { TOPICS_LIST } from "@/features/topics/topicsList";
import { QuestionsTopic } from "@/features/topics/questions/QuestionsTopic";
import styles from "../topics.module.css";
import pageStyles from "./topic.module.css";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = TOPICS_LIST.find((t) => t.slug === slug);
  if (!topic) notFound();

  const { username } = await getLearningContext();

  return (
    <div className={styles.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={pageStyles.wrap}>
        <Link href="/topics" className={pageStyles.backLink}>
          ← К темам
        </Link>
        {topic.slug === "questions" && <QuestionsTopic />}
      </main>
      <BottomTabBar />
    </div>
  );
}
