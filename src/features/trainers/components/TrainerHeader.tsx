import Link from "next/link";
import styles from "./TrainerHeader.module.css";

// Заголовок страницы тренажёра. Раньше «← Назад» была текстовой ссылкой
// на 13px: на телефоне она стояла в одной строке с заголовком, спорила
// с ним по весу и требовала прицеливаться. Теперь это круглая кнопка
// с понятной зоной нажатия, а строку заголовка она больше не перебивает.
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
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M10 3 5 8l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
}
