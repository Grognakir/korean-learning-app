/** Иконки Solomon OS (из макета desktop.html): заливка — цвет иконки,
 * контур — currentColor (тёмный «ink»). */

export type IconName =
  | "msg"
  | "call"
  | "map"
  | "shop"
  | "bank"
  | "cal"
  | "photo"
  | "term"
  | "set"
  | "seal"
  | "min"
  | "max"
  | "restore"
  | "close"
  | "bell"
  | "refresh"
  | "power";

const S = { stroke: "currentColor", strokeLinejoin: "round" as const };

const PATHS: Record<IconName, { box: number; body: React.ReactNode }> = {
  msg: {
    box: 24,
    body: (
      <>
        <path d="M3 4h18v12H9l-5 4v-4H3z" {...S} strokeWidth="1.4" />
        <path d="M7 9h10M7 12h6" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  call: {
    box: 24,
    body: (
      <path
        d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"
        {...S}
        strokeWidth="1.4"
      />
    ),
  },
  map: {
    box: 24,
    body: (
      <>
        <path
          d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"
          {...S}
          strokeWidth="1.4"
        />
        <circle cx="12" cy="10" r="2.5" fill="currentColor" />
      </>
    ),
  },
  // Витрина магазина: навес с фестонами, стена и дверь (выбран вариант 3).
  shop: {
    box: 24,
    body: (
      <>
        <path
          d="M3 9.5 4.5 4h15L21 9.5a2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0A2.25 2.25 0 0 1 3 9.5z"
          {...S}
          strokeWidth="1.1"
        />
        <path d="M4.5 12v8h15v-8" {...S} strokeWidth="1.2" />
        <path d="M10 20v-4.5h4V20" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </>
    ),
  },
  bank: {
    box: 24,
    body: (
      <>
        <path d="M3 9l9-5 9 5v1H3zM4 19h16v2H4z" {...S} strokeWidth="1.2" />
        <path d="M6 11h2v7H6zM11 11h2v7h-2zM16 11h2v7h-2z" />
      </>
    ),
  },
  cal: {
    box: 24,
    body: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
          {...S}
          strokeWidth="1.4"
        />
        <path
          d="M3 10h18M8 3v4M16 3v4"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>
    ),
  },
  photo: {
    box: 24,
    body: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          {...S}
          strokeWidth="1.4"
        />
        <path d="M5 17l4-4 3 3 3-3 4 4z" fill="currentColor" />
        <circle cx="16" cy="9" r="1.6" fill="currentColor" />
      </>
    ),
  },
  term: {
    box: 24,
    body: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
          {...S}
          strokeWidth="1.4"
        />
        <path
          d="M7 9l3 3-3 3M12 15h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </>
    ),
  },
  set: {
    box: 24,
    body: (
      <>
        <path
          d="M10 2h4l.6 2.6 2.3 1 2.3-1.4 2.8 2.8-1.4 2.3 1 2.3L24 12v0l-2.6.6-1 2.3 1.4 2.3-2.8 2.8-2.3-1.4-2.3 1L14 22h-4l-.6-2.6-2.3-1-2.3 1.4L2 17l1.4-2.3-1-2.3L0 12l2.6-.6 1-2.3L2.2 6.8 5 4l2.3 1.4 2.3-1z"
          transform="scale(.9) translate(1.3 1.3)"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      </>
    ),
  },
  seal: {
    box: 100,
    body: (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="50" cy="50" r="46" />
        <path d="M50 12 83 69H17z" />
        <path d="M50 88 17 31h66z" />
        <circle cx="50" cy="50" r="6" />
      </g>
    ),
  },
  min: {
    box: 12,
    body: <path d="M2 9h8" stroke="currentColor" strokeWidth="1.5" />,
  },
  max: {
    box: 12,
    body: (
      <rect
        x="2"
        y="2"
        width="8"
        height="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    ),
  },
  restore: {
    box: 12,
    body: (
      <>
        <rect
          x="2"
          y="4"
          width="6"
          height="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="M4 4V2h6v6H8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </>
    ),
  },
  close: {
    box: 12,
    body: (
      <path
        d="M2.5 2.5l7 7M9.5 2.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    ),
  },
  refresh: {
    box: 24,
    body: (
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
        <path d="M19.5 4v4.5H15" />
      </g>
    ),
  },
  bell: {
    box: 24,
    body: (
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </g>
    ),
  },
  power: {
    box: 24,
    body: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 3v9" />
        <path d="M6.3 6.8a8 8 0 1 0 11.4 0" />
      </g>
    ),
  },
};

export function OsIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const { box, body } = PATHS[name];
  return (
    <svg className={className} viewBox={`0 0 ${box} ${box}`} aria-hidden="true">
      {body}
    </svg>
  );
}
