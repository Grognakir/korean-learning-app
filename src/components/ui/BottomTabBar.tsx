import type { ComponentType } from "react";
import Link from "next/link";
import styles from "./BottomTabBar.module.css";

export type TabSection = {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  href?: string;
};

/**
 * Видна только на мобильных ширинах (см. медиа-запрос в BottomTabBar.module.css,
 * порог держать в синхроне с UserMenu.module.css/page.module.css — 1000px).
 * Разделы без href — заглушки (нет ещё реального роута).
 */
export function BottomTabBar({ sections }: { sections: TabSection[] }) {
  return (
    <nav className={styles.bar} aria-label="Разделы приложения">
      {sections.map(({ label, icon: Icon, href }) =>
        href ? (
          <Link key={label} href={href} className={styles.tab}>
            <Icon size={20} className={styles.tabIcon} />
            <span className={styles.tabLabel}>{label}</span>
          </Link>
        ) : (
          <span key={label} className={styles.tab} title="Скоро">
            <Icon size={20} className={styles.tabIcon} />
            <span className={styles.tabLabel}>{label}</span>
          </span>
        ),
      )}
    </nav>
  );
}
