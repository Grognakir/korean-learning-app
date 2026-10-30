"use client";

import { useEffect, useState } from "react";
import { ClothingIcon } from "../clothing/ClothingIcon";
import { COLOR_BY_ID, COLORS, PATTERN_BY_ID, PATTERNS, type ColorId, type PatternId } from "../clothing/colors";
import { ITEM_BY_ID, itemPattern } from "../clothing/items";
import { recolorIcon } from "../clothing/recolorIcon";
import type { PurchaseResult } from "./parsePurchase";
import styles from "./StoryGame.module.css";

/** Окно-примерочная для вещи с полки: затемнённая сцена, крупное превью в
 * выбранном цвете, палитра, узоры и «… 주세요». Прежний вариант с
 * цветовым колесом (6.3) сохранён в
 * content/reference/art-sources/dialogue/palette-6.3-wheel/. */
export function Palette({
  id,
  onBuy,
  onClose,
}: {
  id: string;
  onBuy: (result: PurchaseResult) => void;
  onClose: () => void;
}) {
  const item = ITEM_BY_ID[id];
  const [color, setColor] = useState<ColorId | null>(null);
  const [pattern, setPattern] = useState<PatternId>("plain");

  // Все цвета вещи (с выбранным узором) грузятся заранее, чтобы переключение
  // было мгновенным; recolorIcon кеширует результат.
  useEffect(() => {
    if (!item.recolorable) return;
    for (const c of COLORS) void recolorIcon(id, c.id, itemPattern(item, pattern));
  }, [id, item, pattern]);

  const phrase = [
    color && item.recolorable ? COLOR_BY_ID[color].ko : null,
    pattern !== "plain" ? PATTERN_BY_ID[pattern].ko : null,
    item.ko,
  ]
    .filter(Boolean)
    .join(" ");

  const buy = () => {
    if (item.recolorable && !color) return onBuy({ kind: "needColor", id });
    onBuy({
      kind: "ok",
      piece: { id, color: item.recolorable && color ? color : "white", pattern: itemPattern(item, pattern) },
    });
  };

  return (
    <>
      <div className={styles.paletteDim} onClick={onClose} />
      <div className={`${styles.palettePanel} ${styles.fittingRoom}`} role="dialog" aria-label={`Цвет: ${item.ko}`}>
        <div className={styles.palettePreview}>
          <ClothingIcon id={id} color={color ?? "white"} pattern={pattern} size={200} />
        </div>
        <div className={styles.paletteBody}>
          <div className={styles.paletteHead}>
            <span className={`${styles.pickerTitle} kr`}>
              {item.ko} · {item.ru.toUpperCase()}
            </span>
            <button type="button" className={styles.paletteClose} onClick={onClose} aria-label="Закрыть палитру">
              ×
            </button>
          </div>
          {item.recolorable && (
            <div className={styles.swatchGrid}>
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.swatch} kr ${color === c.id ? styles.swatchOn : ""}`}
                  aria-pressed={color === c.id}
                  onClick={() => setColor(c.id)}
                >
                  <span className={styles.swatchDot} style={{ background: c.hex }} />
                  {c.ko}
                </button>
              ))}
            </div>
          )}
          {item.patternable && (
            <div className={styles.paletteRow}>
              {PATTERNS.filter((p) => p.id === "plain" || item.patterns.includes(p.id)).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.chip} kr ${pattern === p.id ? styles.chipActive : ""}`}
                  aria-pressed={pattern === p.id}
                  onClick={() => setPattern(p.id)}
                >
                  {p.ko}
                </button>
              ))}
            </div>
          )}
          <div className={styles.paletteBuy}>
            <span className={`${styles.phrase} kr`}>&gt; {phrase} 주세요</span>
            <button
              type="button"
              className={`${styles.nextButton} ${styles.buyButton} kr`}
              onClick={buy}
              disabled={item.recolorable && !color}
            >
              주세요
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
