"use client";

import { useState } from "react";
import type { CategoryOption } from "@/features/dictionary/types";
import { AddWordModal } from "./AddWordModal";
import styles from "./AddWordButton.module.css";

type AddWordButtonProps = {
  categories: CategoryOption[];
  onWordAdded: () => void;
};

export function AddWordButton({ categories, onWordAdded }: AddWordButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.add} onClick={() => setOpen(true)}>
        + Добавить
      </button>
      <AddWordModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        onWordAdded={onWordAdded}
      />
    </>
  );
}
