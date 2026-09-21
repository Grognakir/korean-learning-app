import type { Language } from "@/features/dictionary/types";
import { FlashcardsModeTabs, type FlashcardsMode } from "./FlashcardsModeTabs";
import { NewCardsSlider } from "./NewCardsSlider";
import styles from "./FlashcardsHeader.module.css";

export function FlashcardsHeader({
  active,
  newCardsLimit,
  availableNewCount,
  language,
}: {
  active: FlashcardsMode;
  newCardsLimit: number;
  availableNewCount?: number;
  language: Language;
}) {
  return (
    <div className={styles.root}>
      <FlashcardsModeTabs active={active} language={language} />
      <NewCardsSlider
        key={`${newCardsLimit}:${availableNewCount ?? "default"}`}
        initialValue={newCardsLimit}
        availableCount={availableNewCount}
      />
    </div>
  );
}
