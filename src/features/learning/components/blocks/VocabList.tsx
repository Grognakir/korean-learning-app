"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { VocabListBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { VocabChip } from "./VocabChip";
import { isKnown, useVocabProgress } from "@/features/learning/vocabProgress";
import { VocabTrainer } from "./VocabTrainer";
import styles from "./blocks.module.css";

// "단어" — общее название блока со словами, как "Грамматика"/"Упражнение",
// перевод ему не нужен. Особые именованные подборки (например "전공") —
// перевод есть, но скрыт за иконкой, как у любого учебного текста.
const GENERIC_TITLE = "단어";

type Item = VocabListBlock["items"][number];
type Tab = "main" | "extra" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "main", label: "Основные" },
  { id: "extra", label: "Дополнительные" },
  { id: "all", label: "Все" },
];

function Chips({ items }: { items: Item[] }) {
  return (
    <div className={styles.vocabItems}>
      {items.map((item, i) => (
        <VocabChip
          key={`${item.ko}-${i}`}
          text={item.ko}
          translation={item.translation_ru}
        />
      ))}
    </div>
  );
}

export function VocabList({
  block,
  id,
}: {
  block: VocabListBlock;
  id?: string;
}) {
  const mainKeys = new Set(block.items.map((item) => item.ko));
  // Дополнительные слова — одним списком из всех групп extra_words, без
  // повторов и без слов, которые уже есть среди основных.
  const extraItems = Object.values(block.extra_words ?? {})
    .flat()
    .filter(
      (item, index, all) =>
        !mainKeys.has(item.ko) &&
        all.findIndex((other) => other.ko === item.ko) === index,
    );
  // Блок без основных слов (раздел, где в учебнике нет списка слов) — только
  // дополнительные: вкладок нет.
  const onlyExtra = block.items.length === 0 && extraItems.length > 0;
  const [pickedTab, setTab] = useState<Tab>("main");
  const tab: Tab = onlyExtra ? "extra" : pickedTab;
  const [open, setOpen] = useState(false);

  const itemsByTab: Record<Tab, Item[]> = {
    main: block.items,
    extra: extraItems,
    all: [...block.items, ...extraItems],
  };
  const current = itemsByTab[tab];
  const total = current.length;
  const progress = useVocabProgress();
  const knownCount = current.filter((item) => isKnown(progress[item.ko])).length;

  // Пока идёт тренировка, слова на странице за окном размываются
  // (правило `data-word-trainer` в blocks.module.css).
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.wordTrainer = "";
    return () => {
      delete root.dataset.wordTrainer;
    };
  }, [open]);

  return (
    <div id={id} className={styles.block} data-tooltip-bounds-x="">
      <div className={styles.vocabHead}>
        <span className={styles.labelRow}>
          <span className={`${styles.label} kr`}>{block.title}</span>
          {block.title_ru && block.title !== GENERIC_TITLE && (
            <LabelInfo translation={block.title_ru} />
          )}
        </span>
        {extraItems.length > 0 && !onlyExtra && (
          <div
            className={styles.segTabs}
            role="tablist"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? styles.segTabActive : styles.segTab}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <Chips items={current} />
      {total > 0 && (
        <>
          <button
            type="button"
            className={styles.trainRow}
            onClick={() => setOpen(true)}
          >
            <span>
              Тренировать слова ({total})
              {knownCount > 0 && ` · выучено ${knownCount}`}
            </span>
            <span aria-hidden="true">→</span>
          </button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Тренировка слов"
            heading={<span>Тренировка слов</span>}
            reading
            maxWidth={632}
            anchorHeight={375}
          >
            <VocabTrainer items={current} />
          </Modal>
        </>
      )}
    </div>
  );
}
