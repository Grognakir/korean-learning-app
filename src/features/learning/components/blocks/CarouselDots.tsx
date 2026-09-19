import styles from "./blocks.module.css";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CarouselArrows({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  if (count <= 1) return null;
  return (
    <>
      <button
        type="button"
        className={styles.carouselArrowPrev}
        aria-label="Предыдущая карточка"
        disabled={active <= 0}
        onClick={() => onSelect(Math.max(0, active - 1))}
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        className={styles.carouselArrowNext}
        aria-label="Следующая карточка"
        disabled={active >= count - 1}
        onClick={() => onSelect(Math.min(count - 1, active + 1))}
      >
        <ArrowIcon direction="right" />
      </button>
    </>
  );
}

export function CarouselDots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  if (count <= 1) return null;
  return (
    <div className={styles.carouselDots} role="tablist" aria-label="Карточки">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === active}
          aria-label={`Карточка ${i + 1} из ${count}`}
          className={i === active ? styles.carouselDotActive : styles.carouselDot}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
