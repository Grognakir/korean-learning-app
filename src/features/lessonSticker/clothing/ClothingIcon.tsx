"use client";

import { useEffect, useState } from "react";
import type { ColorId, PatternId } from "./colors";
import { ICON_BASE, ITEM_BY_ID, itemPattern } from "./items";
import { recolorIcon } from "./recolorIcon";
import styles from "./ClothingIcon.module.css";

/** Иконка вещи; цвет и узор накладываются по маске ткани на canvas. */
export function ClothingIcon({
  id,
  color = "white",
  pattern = "plain",
  size = 72,
}: {
  id: string;
  color?: ColorId;
  pattern?: PatternId;
  size?: number;
}) {
  const item = ITEM_BY_ID[id];
  const effectiveColor = item.recolorable ? color : "white";
  const effectivePattern = itemPattern(item, pattern);
  const key = `${id}:${effectiveColor}:${effectivePattern}`;
  const [rendered, setRendered] = useState<{ id: string; key: string; src: string } | null>(null);

  useEffect(() => {
    if (!item.recolorable) return;
    let alive = true;
    recolorIcon(id, effectiveColor, effectivePattern).then((src) => {
      if (alive && src) setRendered({ id, key, src });
    });
    return () => {
      alive = false;
    };
  }, [id, item.recolorable, effectiveColor, effectivePattern, key]);

  const plain = effectiveColor === "white" && effectivePattern === "plain";
  // Пока грузится новый цвет, остаётся прежняя картинка этой вещи — без
  // мигания белой иконкой между цветами.
  const src = !plain && rendered?.id === id ? rendered.src : `${ICON_BASE}/${id}.png`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={item.ko}
      className={styles.icon}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
