import Link from "next/link";
import { displayName, requireUser } from "@/features/auth/requireUser";
import { AppHeader } from "@/components/layout/AppHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { buildRelatedWordsQueue } from "@/features/trainers/flashcards/buildQueue";
import { FlashcardSession } from "@/features/trainers/flashcards/components/FlashcardSession";
import { FlashcardsHeader } from "@/features/trainers/flashcards/components/FlashcardsHeader";
import layout from "../../../learning.module.css";
import styles from "../flashcards.module.css";

export default async function FlashcardsRelatedPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, srs_new_cards_per_session")
    .eq("id", user.id)
    .single();
  const username = displayName(profile, user);
  const newCardsLimit = profile?.srs_new_cards_per_session ?? 20;
  const queue = await buildRelatedWordsQueue(supabase, user.id, newCardsLimit);

  return (
    <div className={layout.page}>
      <AppHeader username={username} />
      <main className={`${layout.wrap} ${styles.wrap}`}>
        <Link href="/learning/trainers" className={layout.backLink}>
          ← Назад
        </Link>
        <h1 className={layout.title}>Карточки слов</h1>
        <div className={styles.column}>
          <FlashcardsHeader
            active="antonyms-synonyms"
            newCardsLimit={newCardsLimit}
          />
          <FlashcardSession queue={queue} />
        </div>
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
