import { FlashcardsModeTabs, type FlashcardsMode } from "./FlashcardsModeTabs";
import { NewCardsSlider } from "./NewCardsSlider";
import styles from "./FlashcardsHeader.module.css";

export function FlashcardsHeader({
  active,
  newCardsLimit,
}: {
  active: FlashcardsMode;
  newCardsLimit: number;
}) {
  return (
    <div className={styles.root}>
      <FlashcardsModeTabs active={active} />
      <NewCardsSlider initialValue={newCardsLimit} />
    </div>
  );
}
