"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { clampTooltipToViewport } from "./tooltipClamp";
import styles from "./blocks.module.css";

export function VocabChip({
  text,
  translation,
  className,
  nested = false,
}: {
  text: ReactNode;
  translation: string;
  className?: string;
  /** true — чип сидит внутри уже кликабельного родителя (например пункта
   * упражнения), поэтому: (1) внутренний элемент — не <button> (вложенные
   * button-в-button невалидны и рендерятся браузером непредсказуемо), а
   * <span role="button">; (2) тап/клик останавливает всплытие, чтобы не
   * триггерить родительский onClick — иначе на мобильных (где нет hover)
   * посмотреть перевод невозможно, не выбрав/не запустив пункт упражнения. */
  nested?: boolean;
}) {
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const handleReveal = () => {
    if (tooltipRef.current) clampTooltipToViewport(tooltipRef.current);
  };
  const stopBubble = (e: { stopPropagation: () => void }) => {
    if (nested) e.stopPropagation();
  };

  return (
    <span
      className={`${styles.vocabItem} ${className ?? ""}`}
      onMouseEnter={handleReveal}
      onFocus={handleReveal}
      onClick={stopBubble}
    >
      {nested ? (
        <span
          role="button"
          tabIndex={0}
          className={`${styles.vocabKo} kr`}
          onPointerDown={stopBubble}
        >
          {text}
        </span>
      ) : (
        <button type="button" className={`${styles.vocabKo} kr`}>
          {text}
        </button>
      )}
      <span ref={tooltipRef} className={styles.vocabTranslation} role="tooltip">
        {translation}
      </span>
    </span>
  );
}
