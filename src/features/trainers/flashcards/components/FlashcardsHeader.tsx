import { FlashcardsModeTabs, type FlashcardsMode } from "./FlashcardsModeTabs";
import { NewCardsSlider } from "./NewCardsSlider";
import styles from "./FlashcardsHeader.module.css";

export function FlashcardsHeader({
  active,
  newCardsLimit,
  availableNewCount,
  unit,
}: {
  active: FlashcardsMode;
  newCardsLimit: number;
  availableNewCount?: number;
  unit?: "cards" | "pairs";
}) {
  return (
    <div className={styles.root}>
      <FlashcardsModeTabs active={active} />
      <NewCardsSlider
        key={`${newCardsLimit}:${availableNewCount ?? "default"}`}
        initialValue={newCardsLimit}
        availableCount={availableNewCount}
        unit={unit}
      />
    </div>
  );
}
