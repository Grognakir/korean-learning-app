import { getLearningContext } from "@/features/auth/getLearningContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { loadPracticeWords } from "@/features/trainers/vocabulary/loadWords";
import { makePairRounds } from "@/features/trainers/vocabulary/exercises";
import { PairSession } from "@/features/trainers/vocabulary/PairSession";
import { TrainerHeader } from "@/features/trainers/components/TrainerHeader";
import layout from "../../learning.module.css";
import styles from "@/features/trainers/vocabulary/Practice.module.css";

export default async function PracticePage() {
  const { supabase, username, activeLanguage, user } = await getLearningContext();
  const words = await loadPracticeWords(supabase, activeLanguage);
  return <div className={layout.page}>
    {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
    <main className={`${layout.wrap} ${styles.wrap}`}>
      <TrainerHeader href="/learning/trainers" title="Найди пары" backLabel="К тренажёрам" />
      <p className={styles.description}>Соединяйте слова с переводами. Три коротких раунда без таймера — можно спокойно подумать.</p>
      <PairSession key={`${user?.id ?? "guest"}:${activeLanguage}`} initialRounds={makePairRounds(words)} />
    </main>
    <BottomTabBar sections={NAV_SECTIONS} />
  </div>;
}
