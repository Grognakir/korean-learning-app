"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  MANNEQUIN_KO,
  MANNEQUIN_SIZE,
  mannequinSrc,
  ZONE_BOXES,
  ZONE_BY_INDEX,
  ZONES,
  zonesSrc,
  type MannequinKind,
  type ZoneId,
} from "./mannequins";
import styles from "./StoryGame.module.css";
import { usePhone } from "./usePhone";

type ZoneMap = { data: Uint8ClampedArray; highlight: Map<ZoneId, string> };

const maps = new Map<MannequinKind, Promise<ZoneMap | null>>();

/** Карта зон манекена: пиксели (красный канал = индекс зоны) и готовые
 * картинки подсветки каждой зоны. Грузится один раз на манекен. */
function loadZoneMap(kind: MannequinKind): Promise<ZoneMap | null> {
  let result = maps.get(kind);
  if (!result) {
    result = new Promise<ZoneMap | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = MANNEQUIN_SIZE;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, width, height);
        const data = ctx.getImageData(0, 0, width, height).data;
        const highlight = new Map<ZoneId, string>();
        ZONE_BY_INDEX.forEach((zone, index) => {
          if (!zone) return;
          const layer = ctx.createImageData(width, height);
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0 && data[i] === index) {
              layer.data[i] = 200;
              layer.data[i + 1] = 255;
              layer.data[i + 2] = 215;
              layer.data[i + 3] = 165;
            }
          }
          const out = document.createElement("canvas");
          out.width = width;
          out.height = height;
          out.getContext("2d")?.putImageData(layer, 0, 0);
          highlight.set(zone, out.toDataURL("image/png"));
        });
        resolve({ data, highlight });
      };
      img.onerror = () => resolve(null);
      img.src = zonesSrc(kind);
    });
    maps.set(kind, result);
  }
  return result;
}

export type ZoneAnchor = {
  kind: MannequinKind;
  zone: ZoneId;
  rect: DOMRect;
  box: DOMRect;
};

/** Выноска к зоне, как в играх: квадратик у края зоны, угловатая линия
 * наружу (у мужского манекена — влево, у женского — вправо; на телефоне
 * всегда вправо, там манекен один и слева у края нет места) и подпись. */
function ZoneCallout({
  kind,
  zone,
  left,
}: {
  kind: MannequinKind;
  zone: ZoneId;
  left: boolean;
}) {
  const box = ZONE_BOXES[kind][zone];
  if (!box) return null;
  const [x, y, w, h] = box;
  const { width, height } = MANNEQUIN_SIZE;
  const dir = left ? -1 : 1;
  const sx = left ? x : x + w;
  const sy = y + h / 2;
  const ex = sx + dir * 22;
  const ly = Math.max(24, sy - 40);
  const lx = left ? Math.min(ex - 24, 96) : Math.max(ex + 24, width - 96);
  const tx = lx + dir * 28;

  return (
    <>
      <svg
        className={styles.callout}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points={`${sx},${sy} ${ex},${sy} ${lx},${ly} ${tx},${ly}`}
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x={sx - 5}
          y={sy - 5}
          width={10}
          height={10}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className={`${styles.calloutLabel} kr`}
        style={{
          top: `${(ly / height) * 100}%`,
          ...(left
            ? { right: `${100 - (tx / width) * 100}%` }
            : { left: `${(tx / width) * 100}%` }),
        }}
      >
        {ZONES[zone].ko}
      </span>
    </>
  );
}

/** Ряд манекенов: по точке указателя спрашивает каждый манекен (сверху
 * вниз), чья зона под курсором. На телефоне виден один манекен, вкладки
 * 남성 / 여성 сверху переключают его. */
export function MannequinRow({
  kinds,
  selected,
  hideCallouts,
  onSelect,
  onDeselect,
}: {
  kinds: MannequinKind[];
  selected: { kind: MannequinKind; zone: ZoneId } | null;
  hideCallouts: boolean;
  onSelect: (anchor: ZoneAnchor) => void;
  /** Снять выбор зоны (у другого манекена такой зоны нет). */
  onDeselect: () => void;
}) {
  const handles = useRef(new Map<MannequinKind, MannequinHandle>());

  // Смена манекена: выбранная зона переносится на новый (полка покажет его
  // вещи), а если такой зоны у него нет — выбор снимается.
  const switchTo = (kind: MannequinKind) => {
    setFront(kind);
    if (!selected || selected.kind === kind) return;
    if (ZONE_BOXES[kind][selected.zone])
      handles.current.get(kind)?.select(selected.zone);
    else onDeselect();
  };
  const [hover, setHover] = useState<{
    kind: MannequinKind;
    zone: ZoneId;
  } | null>(null);
  const [front, setFront] = useState<MannequinKind>(kinds[0]);
  // Кнопки поверх сцены не должны выбирать зону манекена под собой.
  const own = { onClick: stop, onPointerMove: stop };

  const hit = (e: { clientX: number; clientY: number }) => {
    for (const kind of [...kinds].reverse()) {
      const zone = handles.current.get(kind)?.zoneAt(e);
      if (zone) return { kind, zone };
    }
    return null;
  };

  return (
    <div
      className={`${styles.mannequins} ${hover ? styles.mannequinHot : ""}`}
      onPointerMove={(e) => setHover(hit(e))}
      onPointerLeave={() => setHover(null)}
      onClick={(e) => {
        const h = hit(e);
        if (h) handles.current.get(h.kind)?.select(h.zone);
      }}
    >
      {kinds.map((kind) => (
        <Mannequin
          key={kind}
          kind={kind}
          ref={(h) => {
            if (h) handles.current.set(kind, h);
            else handles.current.delete(kind);
          }}
          selected={selected?.kind === kind ? selected.zone : null}
          hover={hover?.kind === kind ? hover.zone : null}
          hideCallouts={hideCallouts}
          onSelect={onSelect}
          className={kind === front ? styles.mqFront : styles.mqBack}
        />
      ))}
      {/* На телефоне мелкие зоны (серьги, шарф) удобнее выбирать списком. */}
      <div
        className={styles.mqZones}
        role="group"
        aria-label="Зоны манекена"
        {...own}
      >
        {ZONE_BY_INDEX.filter((z): z is ZoneId =>
          Boolean(z && ZONE_BOXES[front][z]),
        ).map((zone) => (
          <button
            key={zone}
            type="button"
            className={`${styles.mqZone} kr`}
            aria-pressed={selected?.kind === front && selected.zone === zone}
            data-hot={hover?.kind === front && hover.zone === zone}
            onClick={() => handles.current.get(front)?.select(zone)}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setHover({ kind: front, zone });
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setHover(null);
            }}
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible"))
                setHover({ kind: front, zone });
            }}
            onBlur={() => setHover(null)}
          >
            {ZONES[zone].ko}
          </button>
        ))}
      </div>
      <div
        className={styles.mqThumbs}
        role="group"
        aria-label="Манекен"
        {...own}
      >
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            className={`${styles.mqThumb} ${kind === front ? styles.mqThumbOn : ""}`}
            aria-pressed={kind === front}
            aria-label={`Манекен: ${MANNEQUIN_KO[kind]}`}
            onClick={() => switchTo(kind)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mannequinSrc(kind)}
              alt=""
              className={styles.mqThumbImg}
              draggable={false}
            />
            <span className="kr">{MANNEQUIN_KO[kind]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function stop(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export type MannequinHandle = {
  zoneAt: (e: { clientX: number; clientY: number }) => ZoneId | null;
  select: (zone: ZoneId) => void;
};

/** Манекен-голограмма: наведение подсвечивает зону, клик выбирает.
 * Указатель обрабатывает общий контейнер (MannequinRow): манекены стоят
 * внахлёст, и прозрачный край одного не должен закрывать другой.
 * Для клавиатуры и тестов зоны продублированы скрытыми кнопками. */
export function Mannequin({
  kind,
  selected,
  hover,
  hideCallouts = false,
  onSelect,
  className,
  ref,
}: {
  kind: MannequinKind;
  selected: ZoneId | null;
  hover: ZoneId | null;
  /** Скрыть выноски (например, пока открыта палитра). */
  hideCallouts?: boolean;
  onSelect: (anchor: ZoneAnchor) => void;
  className?: string;
  ref?: Ref<MannequinHandle>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<ZoneMap | null>(null);
  const phone = usePhone();

  useEffect(() => {
    let alive = true;
    loadZoneMap(kind).then((m) => {
      if (alive) setMap(m);
    });
    return () => {
      alive = false;
    };
  }, [kind]);

  const zoneAt = (e: { clientX: number; clientY: number }): ZoneId | null => {
    if (!map || !boxRef.current) return null;
    const rect = boxRef.current.getBoundingClientRect();
    const x = Math.floor(
      ((e.clientX - rect.left) / rect.width) * MANNEQUIN_SIZE.width,
    );
    const y = Math.floor(
      ((e.clientY - rect.top) / rect.height) * MANNEQUIN_SIZE.height,
    );
    if (
      x < 0 ||
      y < 0 ||
      x >= MANNEQUIN_SIZE.width ||
      y >= MANNEQUIN_SIZE.height
    )
      return null;
    const i = (y * MANNEQUIN_SIZE.width + x) * 4;
    return map.data[i + 3] > 0 ? (ZONE_BY_INDEX[map.data[i]] ?? null) : null;
  };

  const select = (zone: ZoneId) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const [x, y, w, h] = ZONE_BOXES[kind][zone] ?? [
      0,
      0,
      MANNEQUIN_SIZE.width,
      MANNEQUIN_SIZE.height,
    ];
    const sx = rect.width / MANNEQUIN_SIZE.width;
    const sy = rect.height / MANNEQUIN_SIZE.height;
    onSelect({
      kind,
      zone,
      rect: new DOMRect(rect.left + x * sx, rect.top + y * sy, w * sx, h * sy),
      box: rect,
    });
  };

  useImperativeHandle(ref, () => ({ zoneAt, select }));

  const zones = ZONE_BY_INDEX.filter((z): z is ZoneId =>
    Boolean(z && ZONE_BOXES[kind][z]),
  );

  return (
    <div className={`${styles.mannequin} ${className ?? ""}`}>
      <div ref={boxRef} className={styles.mannequinBox}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mannequinSrc(kind)}
          alt=""
          className={styles.mannequinImg}
          draggable={false}
        />
        {map &&
          [selected, hover !== selected ? hover : null].map(
            (zone) =>
              zone && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={zone}
                  src={map.highlight.get(zone)}
                  alt=""
                  className={styles.zoneGlow}
                  draggable={false}
                />
              ),
          )}
        {/* Выноска выбранной зоны остаётся, у наведённой появляется вторая. */}
        {!hideCallouts &&
          [selected, hover !== selected ? hover : null].map(
            (zone) =>
              zone && (
                <ZoneCallout
                  key={zone}
                  kind={kind}
                  zone={zone}
                  left={kind === "male" && !phone}
                />
              ),
          )}
      </div>
      <div className={styles.srOnly}>
        {zones.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => select(zone)}
            aria-label={`${MANNEQUIN_KO[kind]}: ${ZONES[zone].ko}`}
          >
            {ZONES[zone].ko}
          </button>
        ))}
      </div>
    </div>
  );
}
