import Link from "next/link";
import { redirect } from "next/navigation";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { buildRelatedWordsQueue } from "@/features/trainers/flashcards/buildQueue";
import { FlashcardSession } from "@/features/trainers/flashcards/components/FlashcardSession";
import { FlashcardsHeader } from "@/features/trainers/flashcards/components/FlashcardsHeader";
import layout from "../../../learning.module.css";
import styles from "../flashcards.module.css";

export default async function FlashcardsRelatedPage() {
  const { supabase, user, username, newCardsLimit, activeLanguage: language } = await getLearningContext();

  // Антонимы/синонимы есть только для корейского словаря — прямой заход
  // по URL в английском режиме уводит на основной режим тренажёра.
  if (language === "en") redirect("/learning/trainers/flashcards");

  const queue = await buildRelatedWordsQueue(supabase, user?.id ?? null, newCardsLimit);

  return (
    <div className={layout.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={`${layout.wrap} ${styles.wrap}`}>
        <Link href="/learning/trainers" className={layout.backLink}>
          ← Назад
        </Link>
        <h1 className={layout.title}>Карточки слов</h1>
        <div className={styles.column}>
          <FlashcardsHeader
            active="antonyms-synonyms"
            newCardsLimit={newCardsLimit}
            language={language}
          />
          <FlashcardSession guest={!user} key={`${user?.id ?? null}:${newCardsLimit}`} queue={queue} />
        </div>
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
