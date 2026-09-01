import Link from "next/link";
import type { Language } from "@/features/dictionary/types";
import styles from "./FlashcardsModeTabs.module.css";

const TABS = [
  { key: "main", href: "/learning/trainers/flashcards", label: "Основной" },
  {
    key: "antonyms-synonyms",
    href: "/learning/trainers/flashcards/antonyms-synonyms",
    label: "Антонимы/Синонимы",
  },
] as const;

export type FlashcardsMode = (typeof TABS)[number]["key"];

// Антонимы/синонимы — только для корейского словаря: данных для
// английского нет и не планируется этой задачей.
export function FlashcardsModeTabs({
  active,
  language,
}: {
  active: FlashcardsMode;
  language: Language;
}) {
  const tabs = language === "en" ? TABS.filter((t) => t.key === "main") : TABS;
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          role="tab"
          aria-selected={tab.key === active}
          className={tab.key === active ? styles.tabActive : styles.tab}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
