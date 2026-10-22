import { getLearningContext } from "@/features/auth/getLearningContext";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { buildRelatedWordsQueue } from "@/features/trainers/flashcards/buildQueue";
import { FlashcardSession } from "@/features/trainers/flashcards/components/FlashcardSession";
import { FlashcardsHeader } from "@/features/trainers/flashcards/components/FlashcardsHeader";
import { SessionSettings } from "@/features/trainers/flashcards/components/SessionSettings";
import { TrainerHeader } from "@/features/trainers/components/TrainerHeader";
import { TrainerWorkspace } from "@/features/trainers/components/TrainerWorkspace";
import layout from "../../../learning.module.css";
import styles from "../flashcards.module.css";

export default async function FlashcardsRelatedPage() {
  const { supabase, user, username, newCardsLimit } = await getLearningContext();

  const queue = await buildRelatedWordsQueue(supabase, user?.id ?? null, newCardsLimit);

  return (
    <div className={`${layout.page} ${styles.fixedPage}`}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={layout.wrap}>
        <TrainerWorkspace>
          <TrainerHeader href="/learning/trainers" title="Карточки слов" backLabel="К тренажёрам" />
          <div className={styles.column}>
            <SessionSettings summary={`Антонимы/синонимы · ${newCardsLimit} новых`}>
              <FlashcardsHeader
                active="antonyms-synonyms"
                newCardsLimit={newCardsLimit}
              />
            </SessionSettings>
            <FlashcardSession guest={!user} key={`${user?.id ?? null}:${newCardsLimit}`} queue={queue} />
          </div>
        </TrainerWorkspace>
      </main>
      <BottomTabBar />
    </div>
  );
}
