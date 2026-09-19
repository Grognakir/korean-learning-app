import { getLearningContext } from "@/features/auth/getLearningContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { loadPracticeWords } from "@/features/trainers/vocabulary/loadWords";
import { makeSpellingItems } from "@/features/trainers/vocabulary/exercises";
import { SpellingSession } from "@/features/trainers/vocabulary/SpellingSession";
import { TrainerHeader } from "@/features/trainers/components/TrainerHeader";
import { TrainerWorkspace } from "@/features/trainers/components/TrainerWorkspace";
import layout from "../../learning.module.css";
import styles from "@/features/trainers/vocabulary/Practice.module.css";

export default async function PracticePage() {
  const { supabase, username, activeLanguage, user } = await getLearningContext();
  const words = await loadPracticeWords(supabase, activeLanguage);
  return <div className={layout.page}>
    {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
    <main className={layout.wrap}>
      <TrainerWorkspace>
        <TrainerHeader href="/learning/trainers" title="Собери слово" backLabel="К тренажёрам" />
        <p className={styles.description}>Вспоминайте написание по переводу. Соберите слово из знаков, а затем закрепите сложные слова.</p>
        <SpellingSession key={`${user?.id ?? "guest"}:${activeLanguage}`} initialItems={makeSpellingItems(words)} />
      </TrainerWorkspace>
    </main>
    <BottomTabBar />
  </div>;
}
