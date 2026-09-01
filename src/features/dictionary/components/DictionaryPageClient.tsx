"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDictionaryCache } from "@/features/dictionary/DictionaryCacheContext";
import type { CategoryOption } from "@/features/dictionary/types";
import { AddWordButton } from "./AddWordButton";
import { GrammarList } from "./GrammarList";
import { PhraseList } from "./PhraseList";
import { WordList } from "./WordList";
import styles from "@/app/dictionary/dictionary.module.css";

type DictionaryPageClientProps = {
  categories: CategoryOption[];
  phraseCategories: string[];
  grammarCategories: string[];
  userId: string | null;
};

export function DictionaryPageClient({
  categories,
  phraseCategories,
  grammarCategories,
  userId,
}: DictionaryPageClientProps) {
  const [tab, setTab] = useState<"words" | "phrases" | "grammar">("words");
  const router = useRouter();
  const { clearResultsCache } = useDictionaryCache();

  const handleWordsChanged = () => {
    clearResultsCache();
    router.refresh();
  };

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Словарь</h1>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.typeTabs} role="tablist" aria-label="Тип контента">
          <button
            type="button"
            className={tab === "words" ? styles.typeTabActive : styles.typeTab}
            role="tab"
            aria-selected={tab === "words"}
            onClick={() => setTab("words")}
          >
            Слова
          </button>
          <button
            type="button"
            className={tab === "phrases" ? styles.typeTabActive : styles.typeTab}
            role="tab"
            aria-selected={tab === "phrases"}
            onClick={() => setTab("phrases")}
          >
            Фразы
          </button>
          <button
            type="button"
            className={tab === "grammar" ? styles.typeTabActive : styles.typeTab}
            role="tab"
            aria-selected={tab === "grammar"}
            onClick={() => setTab("grammar")}
          >
            Грамматика
          </button>
        </div>
        {userId && tab === "words" && (
          <AddWordButton categories={categories} onWordAdded={handleWordsChanged} />
        )}
      </div>

      {tab === "words" ? (
        <WordList
          categories={categories}
          userId={userId}
          onWordChanged={handleWordsChanged}
        />
      ) : tab === "phrases" ? (
        <PhraseList categories={phraseCategories} />
      ) : (
        <GrammarList categories={grammarCategories} />
      )}
    </>
  );
}
