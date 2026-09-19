"use client";

import { useState } from "react";
import type { PhraseGalleryBlock } from "@/features/learning/types";
import { CarouselArrows, CarouselDots } from "./CarouselDots";
import { LabelInfo } from "./LabelInfo";
import { useCarouselIndex } from "./useCarouselIndex";
import { VocabChip } from "./VocabChip";
import styles from "./blocks.module.css";

type Phrase = { text: string; translation_ru: string };

function ChevronRight() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path
        d="M2.5 1L6 4L2.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path
        d="M5.5 1L2 4L5.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhraseVocabItem({ phrase }: { phrase: Phrase }) {
  return <VocabChip text={phrase.text} translation={phrase.translation_ru} />;
}

/**
 * Когда у карточки два готовых выражения, на широком месте оба видны рядом
 * как обычно; когда карточке не хватает ширины на оба (3 в ряд/2 в ряд на
 * узких экранах), контейнерный @container-запрос прячет вторую фразу и
 * показывает стрелку — клик переключает active и меняет, какая из фраз (и
 * с какой стороны стрелка) видна. Сам переключатель — чистый CSS
 * (display:none по data-active), реальный layout-порог — только в CSS, не
 * измеряется в JS.
 */
function PhrasePair({ phrases }: { phrases: [Phrase, Phrase] }) {
  const [active, setActive] = useState<0 | 1>(0);

  return (
    <div className={styles.phrasePair} data-active={active}>
      <span className={styles.phrasePairSlot}>
        <PhraseVocabItem phrase={phrases[0]} />
        <button
          type="button"
          className={styles.phraseArrow}
          onClick={() => setActive(1)}
          aria-label="Показать вторую фразу"
        >
          <ChevronRight />
        </button>
      </span>
      <span className={styles.phrasePairSlot}>
        <button
          type="button"
          className={styles.phraseArrow}
          onClick={() => setActive(0)}
          aria-label="Показать первую фразу"
        >
          <ChevronLeft />
        </button>
        <PhraseVocabItem phrase={phrases[1]} />
      </span>
    </div>
  );
}

export function PhraseGallery({
  block,
  id,
}: {
  block: PhraseGalleryBlock;
  id?: string;
}) {
  const { ref, active, scrollTo } = useCarouselIndex<HTMLDivElement>(block.items.length);

  return (
    <div id={id} className={styles.block}>
      {block.title && (
        <span className={styles.labelRow}>
          <span className={`${styles.label} kr`}>{block.title}</span>
          {block.title_ru && <LabelInfo translation={block.title_ru} />}
        </span>
      )}
      <div className={styles.carouselWrap}>
        <div ref={ref} className={styles.phraseGalleryGrid}>
          {block.items.map((item, i) => (
            <div key={i} className={styles.phraseGalleryCard}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.caption}
                  className={styles.phraseGalleryImage}
                />
              ) : (
                <div className={styles.illustrationPlaceholder}>
                  Иллюстрация появится позже
                </div>
              )}
              <div className={styles.phraseGalleryPhrases}>
                {item.phrases.length === 2 ? (
                  <PhrasePair
                    phrases={item.phrases as [Phrase, Phrase]}
                  />
                ) : (
                  item.phrases.map((phrase, j) => (
                    <PhraseVocabItem key={j} phrase={phrase} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        <CarouselArrows count={block.items.length} active={active} onSelect={scrollTo} />
      </div>
      <CarouselDots count={block.items.length} active={active} onSelect={scrollTo} />
    </div>
  );
}
