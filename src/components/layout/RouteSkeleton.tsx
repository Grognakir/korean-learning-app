import styles from "./RouteSkeleton.module.css";

/** Заглушка на время загрузки страницы: заголовок и несколько блоков. Шапку
 * не рисует — для неё нужен запрос имени пользователя. */
export function RouteSkeleton({ blocks = 4 }: { blocks?: number }) {
  return (
    <div className={styles.shell} role="status" aria-busy="true">
      <div className={styles.wrap}>
        <div className={styles.bar} />
        {Array.from({ length: blocks }, (_, i) => (
          <div key={i} className={styles.block} />
        ))}
      </div>
      <span className={styles.visuallyHidden}>Загрузка…</span>
    </div>
  );
}
