"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoryOption } from "@/features/dictionary/types";
import { AddWordButton } from "./AddWordButton";
import { WordList } from "./WordList";
import styles from "@/app/dictionary/dictionary.module.css";

type DictionaryPageClientProps = {
  categories: CategoryOption[];
  userId: string | null;
};

export function DictionaryPageClient({
  categories,
  userId,
}: DictionaryPageClientProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWordAdded = () => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Словарь</h1>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.typeTabs} role="tablist" aria-label="Тип контента">
          <span className={styles.typeTabActive} role="tab" aria-selected="true">
            Слова
          </span>
          <span className={styles.typeTabStub} title="Скоро" role="tab">
            Фразы
          </span>
          <span className={styles.typeTabStub} title="Скоро" role="tab">
            Грамматика
          </span>
        </div>
        {userId && (
          <AddWordButton
            categories={categories}
            onWordAdded={handleWordAdded}
          />
        )}
      </div>

      <WordList
        categories={categories}
        userId={userId}
        refreshKey={refreshKey}
      />
    </>
  );
}
