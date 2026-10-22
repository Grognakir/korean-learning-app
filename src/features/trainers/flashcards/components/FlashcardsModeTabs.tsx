import Link from "next/link";
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

export function FlashcardsModeTabs({ active }: { active: FlashcardsMode }) {
  return (
    <div className={styles.tabs} role="tablist">
      {TABS.map((tab) => (
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
