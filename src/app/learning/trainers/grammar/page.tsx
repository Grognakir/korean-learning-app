import Link from "next/link";
import { redirect } from "next/navigation";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { parseGrammarParams } from "@/features/trainers/grammar/areas";
import { GrammarSetup } from "@/features/trainers/grammar/components/GrammarSetup";
import { loadGrammarAreas } from "@/features/trainers/grammar/loadGrammars";
import layout from "../../learning.module.css";
import styles from "@/features/trainers/grammar/components/GrammarTrainer.module.css";

type SearchParams = { areas?: string | string[]; count?: string | string[]; blitz?: string | string[] };

export default async function GrammarTrainerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseGrammarParams(await searchParams);
  const { supabase, username, activeLanguage } = await getLearningContext();

  // Упражнения есть только для корейской грамматики.
  if (activeLanguage === "en") redirect("/learning/trainers");

  const areas = await loadGrammarAreas(supabase);
  const known = params.areas?.filter((key) => areas.some((area) => area.key === key)) ?? [];

  return (
    <div className={layout.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={`${layout.wrap} ${styles.wrap}`}>
        <Link href="/learning/trainers" className={layout.backLink}>← К тренажёрам</Link>
        <h1 className={layout.title}>Грамматика</h1>
        <p className={styles.description}>
          Разберите правило и сразу закрепите его, потом — смешанная практика по всем грамматикам сессии и блиц на время.
        </p>
        {areas.length > 0 ? (
          <GrammarSetup
            areas={areas.map(({ key, label, count }) => ({ key, label, count }))}
            initial={{ areas: known.length ? known : areas.map((area) => area.key), count: params.count, blitz: params.blitz }}
          />
        ) : (
          <p className={styles.empty}>Упражнения по грамматике пока не добавлены.</p>
        )}
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
