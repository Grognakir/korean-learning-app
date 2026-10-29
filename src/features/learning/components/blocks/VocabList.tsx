"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { VocabListBlock } from "@/features/learning/types";
import { LabelInfo } from "./LabelInfo";
import { VocabChip } from "./VocabChip";
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
  const groups = block.extra_groups ?? [];
  // Блок без основных слов (раздел, где в учебнике нет списка слов) — только
  // дополнительные: вкладок нет.
  const onlyExtra = block.items.length === 0 && groups.length > 0;
  const [pickedTab, setTab] = useState<Tab>("main");
  const tab: Tab = onlyExtra ? "extra" : pickedTab;
  const [open, setOpen] = useState(false);

  const extraItems = groups.flatMap((group) => group.items);
  const itemsByTab: Record<Tab, Item[]> = {
    main: block.items,
    extra: extraItems,
    all: [...block.items, ...extraItems],
  };
  const sections = groups.map((group) => ({
    title: group.title,
    label: group.title_ru ?? group.title,
    main: block.items.filter((item) => item.group === group.title),
    extra: group.items,
  }));
  const groupedTitles = new Set(groups.map((group) => group.title));
  const ungrouped = block.items.filter(
    (item) => !item.group || !groupedTitles.has(item.group),
  );
  if (ungrouped.length > 0) {
    sections.push({
      title: "other",
      label: "Другие",
      main: ungrouped,
      extra: [],
    });
  }
  const shownGroups = sections
    .map((section) => ({
      title: section.title,
      label: section.label,
      items:
        tab === "all" ? [...section.main, ...section.extra] : section.extra,
    }))
    .filter((group) => group.items.length > 0);
  const current = itemsByTab[tab];
  const total = current.length;

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
        {groups.length > 0 && !onlyExtra && (
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
      {tab === "main" && <Chips items={block.items} />}
      {tab !== "main" && (
        <div className={styles.extraGroups}>
          {shownGroups.map((group) => (
            <div key={group.title} className={styles.extraSubGroup}>
              <span className={styles.extraGroupTitle}>{group.label}</span>
              <Chips items={group.items} />
            </div>
          ))}
        </div>
      )}
      {total > 0 && (
        <>
          <button
            type="button"
            className={styles.trainRow}
            onClick={() => setOpen(true)}
          >
            <span>Тренировать слова ({total})</span>
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
