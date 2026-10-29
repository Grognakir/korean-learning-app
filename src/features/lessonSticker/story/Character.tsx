import type { CSSProperties } from "react";
import { poseSrc, SPEAKERS, type Presence, type Speaker } from "./types";
import styles from "./StoryGame.module.css";

/** SVG-фильтр голограммы: яркость → зелёная шкала (тёмный → #0fbf4f →
 * светло-зелёный). Подключается один раз на экран игры. */
export function HologramFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <filter id="story-hologram" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.02 0.06 0.75" />
          <feFuncG type="table" tableValues="0.06 0.75 1" />
          <feFuncB type="table" tableValues="0.03 0.31 0.82" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}

export function Character({
  who,
  pose,
  presence,
}: {
  who: Speaker;
  pose: string;
  presence: Presence;
}) {
  const src = poseSrc(who, pose);
  return (
    <div
      className={`${styles.character} ${presence === "remote" ? styles.hologram : ""}`}
      style={{ "--pose": `url(${src})` } as CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={SPEAKERS[who].name} draggable={false} />
    </div>
  );
}
