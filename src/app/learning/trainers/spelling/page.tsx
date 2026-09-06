import Link from "next/link";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { loadPracticeWords } from "@/features/trainers/vocabulary/loadWords";
import { makeSpellingItems } from "@/features/trainers/vocabulary/exercises";
import { SpellingSession } from "@/features/trainers/vocabulary/SpellingSession";
import layout from "../../learning.module.css";
import styles from "@/features/trainers/vocabulary/Practice.module.css";

export default async function PracticePage() {
  const { supabase, username, activeLanguage, user } = await getLearningContext();
  const words = await loadPracticeWords(supabase, activeLanguage);
  return <div className={layout.page}>
    {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
    <main className={`${layout.wrap} ${styles.wrap}`}>
      <Link href="/learning/trainers" className={layout.backLink}>← К тренажёрам</Link>
      <h1 className={layout.title}>Собери слово</h1>
      <p className={styles.description}>Вспоминайте написание по переводу. Соберите слово из знаков, а затем закрепите сложные слова.</p>
      <SpellingSession key={`${user?.id ?? "guest"}:${activeLanguage}`} initialItems={makeSpellingItems(words)} />
    </main>
    <BottomTabBar sections={NAV_SECTIONS} />
  </div>;
}
