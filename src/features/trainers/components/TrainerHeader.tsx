import Link from "next/link";
import styles from "./TrainerHeader.module.css";

export function TrainerHeader({
  href,
  title,
  backLabel = "Назад",
}: {
  href: string;
  title: string;
  backLabel?: string;
}) {
  return (
    <div className={styles.root}>
      <Link href={href} className={styles.back} aria-label={backLabel} title={backLabel}>
        ← {backLabel}
      </Link>
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
