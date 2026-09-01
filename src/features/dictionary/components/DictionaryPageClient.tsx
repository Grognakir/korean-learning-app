"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDictionaryCache } from "@/features/dictionary/DictionaryCacheContext";
import type { CategoryOption, Language } from "@/features/dictionary/types";
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
  language: Language;
};

export function DictionaryPageClient({
  categories,
  phraseCategories,
  grammarCategories,
  userId,
  language,
}: DictionaryPageClientProps) {
  // Фразы/грамматика — только корейский контент, для английского трека
  // остаётся одна вкладка «Слова».
  const [tab, setTab] = useState<"words" | "phrases" | "grammar">("words");
  const effectiveTab = language === "en" ? "words" : tab;
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
            className={effectiveTab === "words" ? styles.typeTabActive : styles.typeTab}
            role="tab"
            aria-selected={effectiveTab === "words"}
            onClick={() => setTab("words")}
          >
            Слова
          </button>
          {language === "ko" && (
            <>
              <button
                type="button"
                className={
                  effectiveTab === "phrases" ? styles.typeTabActive : styles.typeTab
                }
                role="tab"
                aria-selected={effectiveTab === "phrases"}
                onClick={() => setTab("phrases")}
              >
                Фразы
              </button>
              <button
                type="button"
                className={
                  effectiveTab === "grammar" ? styles.typeTabActive : styles.typeTab
                }
                role="tab"
                aria-selected={effectiveTab === "grammar"}
                onClick={() => setTab("grammar")}
              >
                Грамматика
              </button>
            </>
          )}
        </div>
        {userId && effectiveTab === "words" && (
          <AddWordButton
            categories={categories}
            language={language}
            onWordAdded={handleWordsChanged}
          />
        )}
      </div>

      {effectiveTab === "words" ? (
        <WordList
          categories={categories}
          userId={userId}
          language={language}
          onWordChanged={handleWordsChanged}
        />
      ) : effectiveTab === "phrases" ? (
        <PhraseList categories={phraseCategories} />
      ) : (
        <GrammarList categories={grammarCategories} />
      )}
    </>
  );
}
