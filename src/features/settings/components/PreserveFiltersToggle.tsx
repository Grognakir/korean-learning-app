"use client";

import { useSyncExternalStore } from "react";
import {
  getPreserveDictionaryFilters,
  setPreserveDictionaryFilters,
  subscribePreserveDictionaryFilters,
} from "@/features/settings/dictionaryFiltersPreference";
import styles from "./PreserveFiltersToggle.module.css";

export function PreserveFiltersToggle() {
  const checked = useSyncExternalStore(
    subscribePreserveDictionaryFilters,
    getPreserveDictionaryFilters,
    () => true,
  );

  return (
    <section className={styles.root}>
      <h2 className={styles.sectionTitle}>Навигация между разделами</h2>
      <label className={styles.option}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            setPreserveDictionaryFilters(e.target.checked);
          }}
        />
        Сохранять поиск и фильтры словаря при переходах между разделами
      </label>
    </section>
  );
}
