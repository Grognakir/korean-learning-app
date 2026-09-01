import type { Language } from "@/features/dictionary/types";
import { FlashcardsModeTabs, type FlashcardsMode } from "./FlashcardsModeTabs";
import { NewCardsSlider } from "./NewCardsSlider";
import styles from "./FlashcardsHeader.module.css";

export function FlashcardsHeader({
  active,
  newCardsLimit,
  language,
}: {
  active: FlashcardsMode;
  newCardsLimit: number;
  language: Language;
}) {
  return (
    <div className={styles.root}>
      <FlashcardsModeTabs active={active} language={language} />
      <NewCardsSlider initialValue={newCardsLimit} />
    </div>
  );
}
