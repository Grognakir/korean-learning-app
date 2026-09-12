import Link from "next/link";
import { redirect } from "next/navigation";
import { getLearningContext } from "@/features/auth/getLearningContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { grammarSearch, parseGrammarParams } from "@/features/trainers/grammar/areas";
import { GrammarSession } from "@/features/trainers/grammar/components/GrammarSession";
import { loadGrammarAreas, loadTrainerGrammars } from "@/features/trainers/grammar/loadGrammars";
import { buildGrammarSession } from "@/features/trainers/grammar/session";
import layout from "../../../learning.module.css";
import styles from "@/features/trainers/grammar/components/GrammarTrainer.module.css";

type SearchParams = { areas?: string | string[]; count?: string | string[]; blitz?: string | string[] };

export default async function GrammarSessionPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseGrammarParams(await searchParams);
  const { supabase, username, activeLanguage } = await getLearningContext();

  if (activeLanguage === "en") redirect("/learning/trainers");

  const areas = await loadGrammarAreas(supabase);
  const chosen = params.areas ? areas.filter((area) => params.areas!.includes(area.key)) : areas;
  const pool = await loadTrainerGrammars(supabase, chosen.map((area) => area.category));
  const session = buildGrammarSession(pool, params.count);
  const setupHref = `/learning/trainers/grammar?${grammarSearch({
    areas: params.areas && chosen.length ? chosen.map((area) => area.key) : null,
    count: params.count,
    blitz: params.blitz,
  })}`;

  return (
    <div className={layout.page}>
      {username !== null ? <AppHeader username={username} /> : <GuestHeader />}
      <main className={`${layout.wrap} ${styles.wrap}`}>
        <Link href={setupHref} className={layout.backLink}>← Настройка сессии</Link>
        <h1 className={layout.title}>Грамматика</h1>
        {session.study.length > 0 ? (
          <GrammarSession key={session.id} session={session} blitzSeconds={params.blitz} setupHref={setupHref} />
        ) : (
          <p className={styles.empty}>
            В выбранных областях нет упражнений. <Link href="/learning/trainers/grammar">Выбрать другие</Link>
          </p>
        )}
      </main>
      <BottomTabBar sections={NAV_SECTIONS} />
    </div>
  );
}
