import type { ReactNode } from "react";
import type { Place } from "./catalog";
import styles from "./Map.module.css";

// Рисунки зданий: основание на y=0, здание растёт вверх примерно до y=-42, ширина ±26
export type BuildingId =
  | "mall"
  | "shop"
  | "flowers"
  | "store"
  | "hospital"
  | "vet"
  | "school"
  | "kindergarten"
  | "museum"
  | "temple"
  | "office"
  | "fire"
  | "post"
  | "food"
  | "park"
  | "stadium"
  | "metro"
  | "train"
  | "bus"
  | "crossing"
  | "junction"
  | "city";

const { w, r, k, d, s, t, x, a, l } = {
  w: styles.bWall,
  r: styles.bRoof,
  k: styles.bWin,
  d: styles.bDark,
  s: styles.bLine,
  t: styles.bTree,
  x: styles.bRed,
  a: styles.bAmber,
  l: styles.bLight,
};

const windows = (xs: number[], ys: number[], wd = 5, h = 5) =>
  xs.flatMap((cx) =>
    ys.map((cy) => (
      <rect
        key={`${cx}-${cy}`}
        className={k}
        x={cx}
        y={cy}
        width={wd}
        height={h}
      />
    )),
  );

const awning = (y: number, cls: string) => (
  <>
    <path className={cls} d={`M-22 ${y} L-18 ${y - 9} H18 L22 ${y}Z`} />
    <path
      className={cls}
      d={`M-22 ${y} q3.7 5 7.3 0 q3.7 5 7.3 0 q3.7 5 7.3 0 q3.7 5 7.3 0 q3.7 5 7.3 0 q3.7 5 7.3 0Z`}
    />
  </>
);

const BUILDINGS: Record<BuildingId, ReactNode> = {
  mall: (
    <>
      <rect className={w} x="-25" y="-26" width="50" height="26" />
      <rect className={r} x="-27" y="-31" width="54" height="6" />
      <rect className={a} x="-11" y="-40" width="22" height="9" rx="1.5" />
      <rect className={d} x="-7" y="-13" width="14" height="13" />
      {windows([-21, -14, 9, 16], [-21, -12])}
    </>
  ),
  shop: (
    <>
      <rect className={w} x="-18" y="-24" width="36" height="24" />
      {awning(-12, r)}
      <rect className={d} x="-5" y="-10" width="10" height="10" />
      {windows([-15, 9], [-8], 6, 5)}
    </>
  ),
  flowers: (
    <>
      <rect className={w} x="-18" y="-24" width="36" height="24" />
      {awning(-12, a)}
      <rect className={d} x="-5" y="-10" width="10" height="10" />
      <circle className={x} cx="-15" cy="-4" r="3" />
      <circle className={a} cx="-10" cy="-3" r="2.6" />
      <circle className={l} cx="11" cy="-4" r="2.6" />
      <circle className={x} cx="16" cy="-3" r="3" />
    </>
  ),
  store: (
    <>
      <rect className={w} x="-17" y="-22" width="34" height="22" />
      <rect className={r} x="-17" y="-22" width="34" height="6" />
      <rect className={k} x="-13" y="-12" width="12" height="8" />
      <rect className={d} x="3" y="-12" width="9" height="12" />
    </>
  ),
  hospital: (
    <>
      <rect className={w} x="-18" y="-38" width="36" height="38" />
      <rect className={l} x="-6" y="-35" width="12" height="12" rx="2" />
      <path
        className={x}
        d="M-1.6 -33 h3.2 v3.4 h3.4 v3.2 h-3.4 v3.4 h-3.2 v-3.4 h-3.4 v-3.2 h3.4Z"
      />
      {windows([-14, 9], [-33, -24, -15])}
      <rect className={d} x="-5" y="-11" width="10" height="11" />
    </>
  ),
  vet: (
    <>
      <rect className={w} x="-20" y="-26" width="40" height="26" />
      <rect className={r} x="-22" y="-30" width="44" height="5" />
      <circle className={l} cx="0" cy="-17" r="6" />
      <ellipse className={a} cx="0" cy="-15.5" rx="2.6" ry="2.2" />
      <circle className={a} cx="-3" cy="-19.5" r="1.2" />
      <circle className={a} cx="0" cy="-20.6" r="1.2" />
      <circle className={a} cx="3" cy="-19.5" r="1.2" />
      {windows([-16, 11], [-20])}
      <rect className={d} x="-4" y="-8" width="8" height="8" />
    </>
  ),
  school: (
    <>
      <rect className={w} x="-23" y="-22" width="46" height="22" />
      <path className={r} d="M-11 -22 L0 -33 L11 -22Z" />
      <circle className={l} cx="0" cy="-26" r="3" />
      <path className={s} d="M17 -22 V-42" />
      <path className={x} d="M17 -42 L26 -39 L17 -36Z" />
      {windows([-19, -12, 7, 14], [-17])}
      <rect className={d} x="-4" y="-11" width="8" height="11" />
    </>
  ),
  kindergarten: (
    <>
      <rect className={w} x="-20" y="-20" width="40" height="20" />
      <path
        className={styles.bArc}
        d="M-14 -20 A14 12 0 0 1 14 -20"
        stroke="var(--red)"
      />
      <path
        className={styles.bArc}
        d="M-10 -20 A10 8 0 0 1 10 -20"
        stroke="var(--amber)"
      />
      <path
        className={styles.bArc}
        d="M-6 -20 A6 4.5 0 0 1 6 -20"
        stroke="var(--mid)"
      />
      {windows([-16, 10], [-15], 6, 6)}
      <path className={d} d="M-4 0 V-8 A4 4 0 0 1 4 -8 V0Z" />
    </>
  ),
  museum: (
    <>
      <path className={r} d="M-25 -27 L0 -40 L25 -27Z" />
      <rect className={w} x="-23" y="-27" width="46" height="4" />
      {[-17, -7, 3, 13].map((cx) => (
        <rect key={cx} className={w} x={cx} y="-23" width="4" height="18" />
      ))}
      <rect className={w} x="-26" y="-5" width="52" height="3" />
      <rect className={w} x="-28" y="-2" width="56" height="2.5" />
    </>
  ),
  temple: (
    <>
      <path
        className={r}
        d="M-15 -31 Q-9 -29 -7 -36 H7 Q9 -29 15 -31 L11 -27 H-11Z"
      />
      <rect className={w} x="-11" y="-27" width="22" height="6" />
      <path
        className={r}
        d="M-29 -19 Q-20 -17 -17 -25 H17 Q20 -17 29 -19 L23 -15 H-23Z"
      />
      <rect className={w} x="-18" y="-15" width="36" height="15" />
      {[-15, -6, 3, 12].map((cx) => (
        <rect key={cx} className={x} x={cx} y="-15" width="3" height="15" />
      ))}
    </>
  ),
  office: (
    <>
      <rect className={w} x="-26" y="-18" width="16" height="18" />
      <rect className={w} x="-10" y="-44" width="24" height="44" />
      <rect className={w} x="14" y="-26" width="12" height="26" />
      {windows([-6, 3], [-39, -31, -23, -15], 5, 4)}
      {windows([-23, -17], [-14, -7], 4, 4)}
      {windows([17], [-21, -13], 5, 4)}
    </>
  ),
  fire: (
    <>
      <rect className={w} x="-24" y="-26" width="38" height="26" />
      <rect className={x} x="-24" y="-26" width="38" height="6" />
      <rect className={w} x="14" y="-40" width="10" height="40" />
      <rect className={x} x="14" y="-40" width="10" height="5" />
      {windows([17], [-31, -23], 4, 4)}
      <rect className={d} x="-20" y="-16" width="14" height="16" />
      <rect className={d} x="-4" y="-16" width="14" height="16" />
    </>
  ),
  post: (
    <>
      <rect className={w} x="-20" y="-24" width="40" height="24" />
      <rect className={x} x="-22" y="-28" width="44" height="5" />
      <rect className={l} x="-8" y="-19" width="16" height="10" rx="1" />
      <path className={styles.bInk} d="M-8 -19 L0 -13 L8 -19" />
      {windows([-16, 11], [-18])}
      <rect className={d} x="-4" y="-7" width="8" height="7" />
    </>
  ),
  food: (
    <>
      <path
        className={s}
        d="M-6 -30 q-3 -4 0 -8 q3 -4 0 -8 M4 -30 q-3 -4 0 -8 q3 -4 0 -8"
      />
      {awning(-16, a)}
      <path className={s} d="M-18 -11 V0 M18 -11 V0" />
      <rect className={w} x="-18" y="-8" width="36" height="8" />
      <ellipse className={l} cx="0" cy="-12" rx="6" ry="2.5" />
    </>
  ),
  park: (
    <>
      <path className={s} d="M-12 -8 V0 M2 -16 V0 M13 -6 V0" />
      <circle className={t} cx="-12" cy="-14" r="8" />
      <circle className={t} cx="13" cy="-12" r="7" />
      <circle className={t} cx="2" cy="-25" r="11" />
      <rect className={w} x="-7" y="-3" width="12" height="3" />
    </>
  ),
  stadium: (
    <>
      <path className={s} d="M-22 -14 V-34 M22 -14 V-34" />
      <rect className={a} x="-25" y="-38" width="6" height="4" />
      <rect className={a} x="19" y="-38" width="6" height="4" />
      <ellipse className={w} cx="0" cy="-10" rx="26" ry="11" />
      <ellipse className={t} cx="0" cy="-11" rx="16" ry="6" />
    </>
  ),
  metro: (
    <>
      <rect className={d} x="-18" y="-6" width="30" height="6" />
      <path className={s} d="M-16 -6 V-18 M10 -6 V-18" />
      <path className={r} d="M-20 -22 H14 L12 -17 H-18Z" />
      <path className={s} d="M20 0 V-24" />
      <circle className={l} cx="20" cy="-31" r="7.5" />
      <path
        className={styles.bInk}
        d="M16.5 -28 V-34 L20 -30.5 L23.5 -34 V-28"
      />
    </>
  ),
  train: (
    <>
      <path className={r} d="M-25 -22 Q0 -42 25 -22Z" />
      <rect className={w} x="-25" y="-22" width="50" height="22" />
      <circle className={l} cx="0" cy="-28" r="4" />
      <path className={styles.bInk} d="M0 -30 V-28 H1.6" />
      <path className={d} d="M-6 0 V-10 A6 6 0 0 1 6 -10 V0Z" />
      {windows([-20, -13, 8, 15], [-16], 5, 8)}
    </>
  ),
  bus: (
    <>
      <path className={r} d="M-22 -26 H10 V-22 H-22Z" />
      <rect
        className={k}
        x="-20"
        y="-22"
        width="28"
        height="13"
        opacity="0.35"
      />
      <path className={s} d="M-20 -22 V0 M8 -22 V0" />
      <rect className={w} x="-17" y="-6" width="22" height="3" />
      <path className={s} d="M19 0 V-30" />
      <rect className={a} x="12" y="-42" width="14" height="12" rx="2" />
      <rect className={d} x="15" y="-40" width="8" height="6" rx="1" />
      <path className={styles.bInk} d="M15 -33 h8" />
    </>
  ),
  crossing: (
    <>
      {[-15, -8, -1, 6, 13].map((cx) => (
        <rect
          key={cx}
          className={l}
          x={cx}
          y="-12"
          width="4"
          height="12"
          opacity="0.8"
        />
      ))}
    </>
  ),
  junction: (
    <>
      <path className={s} d="M0 0 V-18" />
      <rect className={d} x="-5" y="-38" width="10" height="22" rx="2.5" />
      <circle className={x} cx="0" cy="-33" r="2.6" />
      <circle className={a} cx="0" cy="-27" r="2.6" />
      <circle cx="0" cy="-21" r="2.6" fill="var(--bright)" />
    </>
  ),
  city: (
    <>
      <rect className={w} x="-24" y="-22" width="14" height="22" />
      <rect className={w} x="-9" y="-42" width="16" height="42" />
      <rect className={w} x="8" y="-30" width="16" height="30" />
      {windows([-21, -16], [-17, -10], 3, 3)}
      {windows([-5, 1], [-37, -29, -21, -13], 3, 4)}
      {windows([12, 18], [-25, -17, -9], 3, 4)}
    </>
  ),
};

const BY_KIND: Record<Place["kind"], BuildingId> = {
  shop: "shop",
  park: "park",
  station: "metro",
  museum: "museum",
  school: "school",
  hospital: "hospital",
  temple: "temple",
  office: "office",
  food: "food",
  crossing: "crossing",
  stop: "bus",
};

export function Building({ place }: { place: Place }) {
  return (
    <g className={styles.building}>
      <ellipse cx="0" cy="1" rx="24" ry="4" className={styles.bBase} />
      {BUILDINGS[place.icon ?? BY_KIND[place.kind]]}
    </g>
  );
}
