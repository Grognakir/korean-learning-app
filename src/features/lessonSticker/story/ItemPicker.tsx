"use client";

import { ClothingIcon } from "../clothing/ClothingIcon";
import { ITEM_BY_ID } from "../clothing/items";
import { ZONES, type ZoneId } from "./mannequins";
import styles from "./StoryGame.module.css";

/** Полка вещей выбранной зоны в окне диалога; выбор вещи открывает
 * палитру (цвет и узор выбираются уже там). */
export function ItemPicker({
  zone,
  items,
  picked,
  onPick,
  className,
}: {
  zone: ZoneId;
  items: string[];
  picked: string | null;
  onPick: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`${styles.picker} ${styles.picker_shelf} ${className ?? ""}`}
      role="group"
      aria-label={`${ZONES[zone].ko} · ${ZONES[zone].ru}`}
    >
      {items.length === 0 ? (
        <span className={styles.hint}>Здесь ничего нет.</span>
      ) : (
        <div className={styles.pickerItems}>
          {items.map((id) => (
            <button
              key={id}
              type="button"
              className={`${styles.pickerItem} ${picked === id ? styles.pickerItemOn : ""}`}
              aria-pressed={picked === id}
              aria-label={`${ITEM_BY_ID[id].ko} — ${ITEM_BY_ID[id].ru}`}
              onClick={() => onPick(id)}
            >
              <ClothingIcon id={id} size={96} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
