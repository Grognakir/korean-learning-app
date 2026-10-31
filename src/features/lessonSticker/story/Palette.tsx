"use client";

import { useEffect, useState } from "react";
import { ClothingIcon } from "../clothing/ClothingIcon";
import {
  COLOR_BY_ID,
  COLORS,
  PATTERN_BY_ID,
  PATTERNS,
  type ColorId,
  type PatternId,
} from "../clothing/colors";
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
  // Белый выбран сразу: вещь всегда какого-то цвета, подсказка «выберите
  // цвет» не нужна.
  const [color, setColor] = useState<ColorId>("white");
  const [pattern, setPattern] = useState<PatternId>("plain");

  // Все цвета вещи (с выбранным узором) грузятся заранее, чтобы переключение
  // было мгновенным; recolorIcon кеширует результат.
  useEffect(() => {
    if (!item.recolorable) return;
    for (const c of COLORS)
      void recolorIcon(id, c.id, itemPattern(item, pattern));
  }, [id, item, pattern]);

  const phrase = [
    item.recolorable ? COLOR_BY_ID[color].ko : null,
    pattern !== "plain" ? PATTERN_BY_ID[pattern].ko : null,
    item.ko,
  ]
    .filter(Boolean)
    .join(" ");

  const buy = () => {
    onBuy({
      kind: "ok",
      piece: {
        id,
        color: item.recolorable ? color : "white",
        pattern: itemPattern(item, pattern),
      },
    });
  };

  return (
    <>
      <div className={styles.paletteDim} onClick={onClose} />
      <div
        className={`${styles.palettePanel} ${styles.fittingRoom}`}
        role="dialog"
        aria-label={`Цвет: ${item.ko}`}
      >
        <div className={styles.palettePreview}>
          <ClothingIcon id={id} color={color} pattern={pattern} size={200} />
        </div>
        <div className={styles.paletteBody}>
          <div className={styles.paletteHead}>
            {/* На узком экране вместо большой картинки — значок у названия
                (прокручивается вместе с ним). */}
            <span className={styles.paletteThumb} aria-hidden>
              <ClothingIcon id={id} color={color} pattern={pattern} size={88} />
            </span>
            <div className={styles.paletteTitles}>
              <span className={`${styles.pickerTitle} kr`}>
                {item.ko} · {item.ru.toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              className={styles.paletteClose}
              onClick={onClose}
              aria-label="Закрыть палитру"
            >
              ×
            </button>
          </div>
          {/* На узком экране у кружков и образцов нет подписей — выбранное
              названо здесь по-корейски с переводом. */}
          {(item.recolorable || item.patternable) && (
            <div className={`${styles.paletteChosen} kr`}>
              {item.recolorable && (
                <span>
                  <b>{COLOR_BY_ID[color].ko}</b>
                  <small>{COLOR_BY_ID[color].ru}</small>
                </span>
              )}
              {item.patternable && (
                <span>
                  <b>{PATTERN_BY_ID[pattern].ko}</b>
                  <small>{PATTERN_BY_ID[pattern].ru}</small>
                </span>
              )}
            </div>
          )}
          {item.recolorable && (
            <div className={styles.swatchGrid}>
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.swatch} kr ${color === c.id ? styles.swatchOn : ""}`}
                  aria-pressed={color === c.id}
                  aria-label={c.ko}
                  title={`${c.ko} · ${c.ru}`}
                  onClick={() => setColor(c.id)}
                >
                  <span
                    className={styles.swatchDot}
                    style={{ background: c.hex }}
                  />
                  <span className={styles.swatchName}>{c.ko}</span>
                </button>
              ))}
            </div>
          )}
          {item.patternable && (
            <div className={styles.paletteRow}>
              {PATTERNS.filter(
                (p) => p.id === "plain" || item.patterns.includes(p.id),
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.chip} kr ${pattern === p.id ? styles.chipActive : ""}`}
                  aria-pressed={pattern === p.id}
                  aria-label={p.ko}
                  title={`${p.ko} · ${p.ru}`}
                  onClick={() => setPattern(p.id)}
                >
                  <span className={styles.patternSample} data-pattern={p.id} />
                  <span className={styles.swatchName}>{p.ko}</span>
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
            >
              주세요
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
