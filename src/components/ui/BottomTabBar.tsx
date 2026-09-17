"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/components/layout/navSections";
import styles from "./BottomTabBar.module.css";

export type TabSection = {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  href?: string;
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Видна только на мобильных ширинах (см. медиа-запрос в BottomTabBar.module.css,
 * порог держать в синхроне с UserMenu.module.css/page.module.css — 1000px).
 * Разделы без href — заглушки (нет ещё реального роута). Список разделов
 * всегда один и тот же (NAV_SECTIONS) — сюда, а не пропом через каждую
 * серверную страницу: проп с функциями-иконками не пересёк бы границу
 * клиентского компонента (usePathname требует "use client").
 */
export function BottomTabBar({ sections = NAV_SECTIONS }: { sections?: TabSection[] }) {
  const pathname = usePathname();
  return (
    <nav className={styles.bar} aria-label="Разделы приложения">
      {sections.map(({ label, icon: Icon, href }) => {
        const active = href ? isActive(pathname, href) : false;
        return href ? (
          <Link
            key={label}
            href={href}
            className={`${styles.tab} ${active ? styles.tabActive : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} className={styles.tabIcon} />
            <span className={styles.tabLabel}>{label}</span>
          </Link>
        ) : (
          <span key={label} className={styles.tab} title="Скоро">
            <Icon size={20} className={styles.tabIcon} />
            <span className={styles.tabLabel}>{label}</span>
          </span>
        );
      })}
    </nav>
  );
}
