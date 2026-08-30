import styles from "./StreakBadge.module.css";

function pluralizeDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

export function StreakBadge({ days }: { days: number }) {
  return (
    <span className={styles.badge}>
      <span aria-hidden>🔥</span>
      {days} {pluralizeDays(days)} подряд
    </span>
  );
}
