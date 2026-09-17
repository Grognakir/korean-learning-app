"use client";

import { useRef } from "react";
import { clampTooltipToViewport } from "./tooltipClamp";
import styles from "./blocks.module.css";

export function VocabChip({
  text,
  translation,
  className,
}: {
  text: string;
  translation: string;
  className?: string;
}) {
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const handleReveal = () => {
    if (tooltipRef.current) clampTooltipToViewport(tooltipRef.current);
  };

  return (
    <span
      className={`${styles.vocabItem} ${className ?? ""}`}
      onMouseEnter={handleReveal}
      onFocus={handleReveal}
    >
      <button type="button" className={`${styles.vocabKo} kr`}>
        {text}
      </button>
      <span ref={tooltipRef} className={styles.vocabTranslation} role="tooltip">
        {translation}
      </span>
    </span>
  );
}
