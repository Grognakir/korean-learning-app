import { FlashcardsModeTabs, type FlashcardsMode } from "./FlashcardsModeTabs";
import { NewCardsSlider } from "./NewCardsSlider";
import styles from "./FlashcardsHeader.module.css";

export function FlashcardsHeader({
  active,
  newCardsLimit,
  availableNewCount,
}: {
  active: FlashcardsMode;
  newCardsLimit: number;
  availableNewCount?: number;
}) {
  return (
    <div className={styles.root}>
      <FlashcardsModeTabs active={active} />
      <NewCardsSlider
        key={`${newCardsLimit}:${availableNewCount ?? "default"}`}
        initialValue={newCardsLimit}
        availableCount={availableNewCount}
      />
    </div>
  );
}
