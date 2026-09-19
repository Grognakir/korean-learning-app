"use client";

import type { ReferenceTableBlock } from "@/features/learning/types";
import { CarouselArrows, CarouselDots } from "./CarouselDots";
import { LabelInfo } from "./LabelInfo";
import { useCarouselIndex } from "./useCarouselIndex";
import { VocabChip } from "./VocabChip";
import styles from "./blocks.module.css";

// Столько стран показываем за раз на мобильной карусели (.countryCell:
// flex: 0 0 50%) — шаг для точек/стрелок, чтобы точка отражала реальный
// шаг прокрутки, а не отдельную страну.
const CELLS_PER_PAGE = 2;

export function ReferenceTable({
  block,
  id,
}: {
  block: ReferenceTableBlock;
  id?: string;
}) {
  const hasFlags = block.flagUrls?.some(Boolean);
  const pageCount = Math.max(1, Math.ceil(block.columns.length / CELLS_PER_PAGE));
  const { ref, active, scrollTo } = useCarouselIndex<HTMLDivElement>(pageCount);

  return (
    <div id={id} className={styles.block}>
      <span className={styles.labelRow}>
        <span className={`${styles.label} kr`}>{block.title}</span>
        {block.title_ru && <LabelInfo translation={block.title_ru} />}
      </span>
      {hasFlags ? (
        <>
          <div className={styles.carouselWrap}>
            <div ref={ref} className={styles.countryGrid}>
              {block.columns.map((column, i) => {
                const translation = block.translations?.[i];
                return (
                  <div key={column} className={styles.countryCell}>
                    {block.flagUrls?.[i] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={block.flagUrls[i]!}
                        alt=""
                        className={styles.countryFlag}
                      />
                    )}
                    {translation ? (
                      <VocabChip text={column} translation={translation} />
                    ) : (
                      <span className={styles.vocabItem}>
                        <button type="button" className={`${styles.vocabKo} kr`}>
                          {column}
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <CarouselArrows count={pageCount} active={active} onSelect={scrollTo} />
          </div>
          <CarouselDots count={pageCount} active={active} onSelect={scrollTo} />
        </>
      ) : (
        <div className={styles.tableColumns}>
          {block.columns.map((column) => (
            <span key={column} className={`${styles.chip} kr`}>
              {column}
            </span>
          ))}
        </div>
      )}
      {block.note && <span className={styles.note}>{block.note}</span>}
    </div>
  );
}
