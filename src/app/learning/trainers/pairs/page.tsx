import { getLearningContext } from "@/features/auth/getLearningContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { loadPracticeWords } from "@/features/trainers/vocabulary/loadWords";
import { makePairRounds } from "@/features/trainers/vocabulary/exercises";
import { PairSession } from "@/features/trainers/vocabulary/PairSession";
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
        <TrainerHeader href="/learning/trainers" title="Найди пары" backLabel="К тренажёрам" />
        <p className={styles.description}>Соединяйте слова с переводами. Три коротких раунда без таймера — можно спокойно подумать.</p>
        <PairSession key={`${user?.id ?? "guest"}:${activeLanguage}`} initialRounds={makePairRounds(words)} />
      </TrainerWorkspace>
    </main>
    <BottomTabBar />
  </div>;
}
