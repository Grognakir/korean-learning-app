import styles from "./SessionProgress.module.css";

export function SessionProgress({ completed, total, label }: { completed: number; total: number; label: string }) {
  const value = Math.min(total, Math.max(0, completed));
  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <span>{label}</span>
        <span>{Math.min(value + 1, total)} / {total}</span>
      </div>
      <div className={styles.track} role="progressbar" aria-label="Прогресс тренировки" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
        <span className={styles.fill} style={{ width: `${total ? value / total * 100 : 0}%` }} />
      </div>
    </div>
  );
}
