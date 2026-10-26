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

export function VocabList({
  block,
  id,
}: {
  block: VocabListBlock;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const total = block.items.length;

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
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
        {block.title_ru && block.title !== GENERIC_TITLE && (
          <LabelInfo translation={block.title_ru} />
        )}
      </span>
      <div className={styles.vocabItems}>
        {block.items.map((item, i) => (
          <VocabChip
            key={`${item.ko}-${i}`}
            text={item.ko}
            translation={item.translation_ru}
          />
        ))}
      </div>
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
            <VocabTrainer items={block.items} />
          </Modal>
        </>
      )}
    </div>
  );
}
