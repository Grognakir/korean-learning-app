"use client";

import { useState } from "react";
import {
  COLOR_BY_ID,
  COLORS,
  PATTERN_BY_ID,
  PATTERNS,
  type ColorId,
  type PatternId,
} from "../clothing/colors";
import { ITEM_BY_ID } from "../clothing/items";
import { ZONE_BY_INDEX, ZONES, type ZoneId } from "./mannequins";
import styles from "./StoryGame.module.css";

type Step = "item" | "color" | "pattern";

/** Режим ввода на телефоне: подсказки по шагам — область → вещь → цвет →
 * узор (реплика продавца видна до нажатия кнопки клавиатуры). Из выбранного
 * собирается фраза в корейском порядке («남색 줄무늬 정장 주세요») и
 * подставляется в строку ввода; писать можно и без корейской раскладки. */
export function TypingPanel({
  cartCount,
  assortment,
  onPhrase,
}: {
  cartCount: number;
  assortment: string[];
  onPhrase: (phrase: string) => void;
}) {
  const [step, setStep] = useState<Step>("item");
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [item, setItem] = useState<string | null>(null);
  const [color, setColor] = useState<ColorId | null>(null);
  const [pattern, setPattern] = useState<PatternId>("plain");

  const it = item ? ITEM_BY_ID[item] : null;
  const zones = ZONE_BY_INDEX.filter(
    (z): z is ZoneId =>
      Boolean(z) && ZONES[z!].items.some((id) => assortment.includes(id)),
  );

  const phrase = (next: {
    item: string | null;
    color: ColorId | null;
    pattern: PatternId;
  }) => {
    const thing = next.item ? ITEM_BY_ID[next.item] : null;
    return [
      thing?.recolorable && next.color ? COLOR_BY_ID[next.color].ko : null,
      thing?.patternable && next.pattern !== "plain"
        ? PATTERN_BY_ID[next.pattern].ko
        : null,
      thing?.ko,
      thing ? "주세요" : null,
    ]
      .filter(Boolean)
      .join(" ");
  };

  const pickItem = (id: string) => {
    const thing = ITEM_BY_ID[id];
    const nextColor = thing.recolorable ? color : null;
    const nextPattern = thing.patterns.includes(pattern as never)
      ? pattern
      : "plain";
    setItem(id);
    setColor(nextColor);
    setPattern(nextPattern);
    setStep(
      thing.recolorable ? "color" : thing.patternable ? "pattern" : "item",
    );
    onPhrase(phrase({ item: id, color: nextColor, pattern: nextPattern }));
  };
  const pickColor = (c: ColorId) => {
    setColor(c);
    if (it?.patternable) setStep("pattern");
    onPhrase(phrase({ item, color: c, pattern }));
  };
  const pickPattern = (p: PatternId) => {
    setPattern(p);
    onPhrase(phrase({ item, color, pattern: p }));
  };

  // Кнопка не забирает фокус у поля ввода — клавиатура остаётся открытой.
  const keep = {
    onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
  };
  const chip = (
    key: string,
    label: React.ReactNode,
    on: boolean,
    onClick: () => void,
  ) => (
    <button
      key={key}
      type="button"
      className={`${styles.wordChip} ${on ? styles.wordChipOn : ""} kr`}
      aria-pressed={on}
      {...keep}
      onClick={onClick}
    >
      {label}
    </button>
  );

  const steps: { id: Step; ko: string; value: string | null; off: boolean }[] =
    [
      { id: "item", ko: "옷", value: it?.ko ?? null, off: false },
      {
        id: "color",
        ko: "색",
        value: color ? COLOR_BY_ID[color].ko : null,
        off: !it?.recolorable,
      },
      {
        id: "pattern",
        ko: "무늬",
        value: PATTERN_BY_ID[pattern].ko,
        off: !it?.patternable,
      },
    ];

  return (
    // data-typing-panel: ОС прячет свою шапку, пока открыт ввод на телефоне.
    <div className={styles.chatPane} data-typing-panel>
      <div className={styles.chatHead}>
        <span>CART·{cartCount}</span>
      </div>
      <div className={styles.chipTabs} role="tablist" aria-label="Шаги">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={step === s.id}
            disabled={s.off}
            className={`${styles.chipTab} kr`}
            {...keep}
            onClick={() => setStep(s.id)}
          >
            <small>{i + 1}</small> {s.value && !s.off ? s.value : s.ko}
          </button>
        ))}
      </div>
      <div className={styles.chips}>
        {step === "item" &&
          (zone ? (
            <>
              {chip("back", "‹ 부위", false, () => setZone(null))}
              {ZONES[zone].items
                .filter((id) => assortment.includes(id))
                .map((id) =>
                  chip(id, ITEM_BY_ID[id].ko, item === id, () => pickItem(id)),
                )}
            </>
          ) : (
            zones.map((z) => chip(z, ZONES[z].ko, false, () => setZone(z)))
          ))}
        {step === "color" &&
          COLORS.map((c) =>
            chip(
              c.id,
              <>
                <span
                  className={styles.wordDot}
                  style={{ background: c.hex }}
                />
                {c.ko}
              </>,
              color === c.id,
              () => pickColor(c.id),
            ),
          )}
        {step === "pattern" &&
          PATTERNS.filter(
            (p) => p.id === "plain" || it?.patterns.includes(p.id as never),
          ).map((p) =>
            chip(p.id, p.ko, pattern === p.id, () => pickPattern(p.id)),
          )}
      </div>
    </div>
  );
}
