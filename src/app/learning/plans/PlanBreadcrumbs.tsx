import Link from "next/link";
import styles from "./PlanBreadcrumbs.module.css";

type BreadcrumbItem = {
  href: string;
  label: string;
};

export function PlanBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className={styles.root} aria-label="Навигация по плану обучения">
      <span className={styles.arrow} aria-hidden="true">←</span>
      {items.map((item, index) => (
        <span key={item.href} className={styles.item}>
          {index > 0 && <span className={styles.separator} aria-hidden="true">/</span>}
          <Link href={item.href} className={styles.link}>{item.label}</Link>
        </span>
      ))}
    </nav>
  );
}
