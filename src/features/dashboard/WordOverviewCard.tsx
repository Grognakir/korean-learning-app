import Link from "next/link";
import { SegmentedProgressBar } from "@/components/ui/SegmentedProgressBar";
import type { WordOverview } from "./wordOverview";
import styles from "@/app/page.module.css";
import buttons from "@/components/ui/Button.module.css";

export function WordOverviewCard({ overview }: { overview: WordOverview | null }) {
  const available = overview ? Math.max(0, overview.total - overview.reviewed) : 0;
  return (
    <section className={styles.wordsCard} aria-label="Ваши слова">
      <div className={styles.taegeukEdge} />
      <div className={styles.wordsCardBody}>
        <h2 className={styles.cardTitle}>Слова</h2>
        {!overview ? (
          <>
            <p role="status">Не удалось загрузить прогресс. Попробуйте обновить страницу.</p>
            <Link href="/learning/trainers/flashcards" className={`${buttons.primary} ${styles.actionLink}`}>Открыть тренировку</Link>
          </>
        ) : overview.total === 0 ? (
          <>
            <p className={styles.dueCount}>Начните со своего словаря</p>
            <p className={styles.planText}>Добавьте первое слово — оно появится в тренировке.</p>
            <Link href="/dictionary" className={`${buttons.primary} ${styles.actionLink}`}>Открыть словарь</Link>
          </>
        ) : (
          <>
            <SegmentedProgressBar segments={[
              { label: `На повторении: ${overview.reviewed}`, value: overview.reviewed, colorVar: "--blue" },
              { label: "Доступно для изучения", value: available, colorVar: "--stone" },
            ]} />
            {overview.due > 0 ? (
              <p className={styles.dueCount}>К повторению сейчас: <strong>{overview.due}</strong></p>
            ) : overview.reviewed === 0 ? (
              <>
                <p className={styles.dueCount}>Начнём с первых слов</p>
                <p className={styles.planText}>Переворачивайте карточки и отмечайте, насколько легко вспомнили ответ. Мы подберём время следующего повторения.</p>
              </>
            ) : (
              <p className={styles.dueCount}>Все повторения выполнены</p>
            )}
            {(overview.due > 0 || available > 0) ? (
              <Link href="/learning/trainers/flashcards" className={`${buttons.primary} ${styles.actionLink}`}>
                {overview.due > 0 ? "Повторять" : overview.reviewed === 0 ? "Начать первую тренировку" : "Учить новые слова"}
              </Link>
            ) : <p className={styles.planText}>Возвращайтесь, когда подойдёт время следующего повторения.</p>}
          </>
        )}
      </div>
    </section>
  );
}
