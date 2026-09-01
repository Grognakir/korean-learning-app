import Link from "next/link";
import { notFound } from "next/navigation";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { shuffle } from "@/features/trainers/flashcards/buildQueue";
import { TopicQuizSession } from "@/features/trainers/topics/components/TopicQuizSession";
import {
  TOPICS,
  VALID_TOPICS,
  type TopicKey,
  type TopicQuizQuestion,
} from "@/features/trainers/topics/types";
import layout from "../../../learning.module.css";

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

  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase
      .from("topic_quiz_questions")
      .select(
        "id, topic, before_text, after_text, question_text, options, correct, translation_ru, hint",
      )
      .eq("topic", topic),
  ]);

  const username = displayName(profile, user);
  const label = TOPICS.find((item) => item.key === topic)?.label ?? topic;
  const questions = shuffle((data ?? []) as TopicQuizQuestion[]);

  return (
    <div className={layout.page}>
      <AppHeader username={username} />
      <main className={layout.wrap}>
        <Link href="/learning/trainers/topics" className={layout.backLink}>
          ← Назад
        </Link>
        <h1 className={layout.title}>{label}</h1>
        <TopicQuizSession questions={questions} />
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
