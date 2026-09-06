import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { shuffle } from "@/features/trainers/flashcards/buildQueue";
import { shuffleOptions } from "@/features/trainers/topics/shuffleOptions";
import { TopicQuizSession } from "@/features/trainers/topics/components/TopicQuizSession";
import {
  TOPICS,
  VALID_TOPICS,
  type TopicKey,
  type TopicQuizQuestion,
} from "@/features/trainers/topics/types";
import layout from "../../../learning.module.css";
import styles from "../topics.module.css";

function isValidTopic(topic: string): topic is TopicKey {
  return (VALID_TOPICS as string[]).includes(topic);
}

export default async function TopicQuizPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  if (!isValidTopic(topic)) notFound();

  const { supabase, username } = await getLearningContext();

  const { data, error } = await supabase
      .from("topic_quiz_questions")
      .select(
        "id, topic, before_text, after_text, question_text, options, correct, translation_ru, hint",
      )
      .eq("topic", topic);
  if (error) throw new Error("Не удалось загрузить вопросы");
  const label = TOPICS.find((item) => item.key === topic)?.label ?? topic;
  const questions = shuffleOptions(shuffle((data ?? []) as TopicQuizQuestion[]));

  return (
    <div className={layout.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={`${layout.wrap} ${styles.sessionWrap}`}>
        <Link href="/learning/trainers/topics" className={layout.backLink}>
          ← Назад
        </Link>
        <h1 className={layout.title}>{label}</h1>
        <TopicQuizSession key={topic} questions={questions} />
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
