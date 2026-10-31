"use client";

import { useId, useState } from "react";
import { placeById, type MapStyle, type Place, type Region } from "./catalog";
import { Building } from "./buildings";
import styles from "./Map.module.css";

// высота схемы с запасом снизу под подписи нижних станций
const H = 840;

export function MapCanvas({
  region,
  style,
  route = [],
  position,
  goal,
  onSelect,
  selected,
  rotation = 0,
}: {
  region: Region;
  style: MapStyle;
  route?: string[];
  position?: string;
  goal?: string;
  onSelect: (place: Place) => void;
  selected?: string;
  rotation?: number;
}) {
  const id = useId().replace(/:/g, "");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 600, y: H / 2 });
  const width = 1200 / zoom,
    height = H / zoom;
  const positions = route.map((p) => placeById(region.id, p)).filter(Boolean);
  const actor = region.places.find((p) => p.id === position);
  const pan = (x: number, y: number) =>
    setCenter((c) => ({
      x: Math.max(width / 2, Math.min(1200 - width / 2, c.x + x)),
      y: Math.max(height / 2, Math.min(H - height / 2, c.y + y)),
    }));
  return (
    <div className={styles.canvas} data-map-style={style}>
      <svg
        viewBox={`${center.x - width / 2} ${center.y - height / 2} ${width} ${height}`}
        className={styles.svg}
        aria-label={`Карта: ${region.ru}`}
      >
        <defs>
          <pattern
            id={`${id}-grid`}
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              className={styles.gridLine}
            />
          </pattern>
          <pattern
            id={`${id}-trees`}
            width="34"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="9" cy="9" r="6" className={styles.parkTree} />
            <circle cx="26" cy="23" r="5" className={styles.parkTree} />
          </pattern>
          <marker
            id={`${id}-arrow`}
            markerWidth="7"
            markerHeight="7"
            refX="4"
            refY="3"
            orient="auto"
          >
            <path d="M0 0 L0 6 L6 3Z" fill="currentColor" />
          </marker>
        </defs>
        <rect width="1200" height={H} className={styles.mapGround} />
        <rect width="1200" height={H} fill={`url(#${id}-grid)`} />
        {region.parks?.map(([x, y, w, h], i) => (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="18"
              className={styles.parkBlock}
            />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="18"
              fill={`url(#${id}-trees)`}
            />
          </g>
        ))}
        {region.water && <path d={region.water} className={styles.water} />}
        {style !== "transit" &&
          Array.from({ length: 12 }, (_, i) => ({
            x: 90 + (i % 4) * 275,
            y: 90 + Math.floor(i / 4) * 240,
            w: 110 + (i % 2) * 45,
          }))
            .filter(
              (b) =>
                !region.parks?.some(
                  ([x, y, w, h]) =>
                    b.x < x + w && b.x + b.w > x && b.y < y + h && b.y + 90 > y,
                ),
            )
            .map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={b.w}
                height="90"
                rx="7"
                className={styles.block}
              />
            ))}
        {region.roads.map((road, i) => {
          const points = road
            .map((p) => placeById(region.id, p))
            .filter(Boolean)
            .map((p) => `${p.x},${p.y}`)
            .join(" ");
          return (
            <g key={i}>
              <polyline points={points} className={styles.roadEdge} />
              <polyline points={points} className={styles.road} />
            </g>
          );
        })}
        {region.id === "songdo" && (
          <>
            <path
              d="M970 740 L740 740 L490 600 L210 520"
              className={styles.metro}
            />
            <text
              x="440"
              y="612"
              textAnchor="end"
              className={styles.metroLabel}
            >
              인천 1호선 · учебная схема
            </text>
            <text x="960" y="85" className={styles.areaLabel}>
              SONGDO
            </text>
          </>
        )}
        {region.id === "lesson" && (
          <>
            <path d="M485 70V730" className={styles.barrier} />
            <path d="M310 440H665" className={styles.underpass} />
            <text x="490" y="420" className={styles.roadLabel}>
              지하도
            </text>
            <text x="820" y="475" className={styles.roadLabel}>
              50m
            </text>
          </>
        )}
        {region.parks?.map(([x, y, w, , ko], i) => (
          <text
            key={i}
            x={x + w / 2}
            y={y + 28}
            textAnchor="middle"
            className={styles.parkLabel}
          >
            {ko}
          </text>
        ))}
        {positions.length > 1 && (
          <>
            <polyline
              points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
              className={styles.routeGlow}
            />
            <polyline
              points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
              className={styles.route}
              markerEnd={`url(#${id}-arrow)`}
            />
          </>
        )}
        {region.places.map((p, i) => {
          const number = route.indexOf(p.id);
          return (
            <g
              key={p.id}
              role="button"
              tabIndex={0}
              aria-label={`${p.ko} — ${p.ru}`}
              onClick={() => onSelect(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(p);
                }
              }}
              className={`${styles.place} ${selected === p.id ? styles.placeSelected : ""} ${style === "transit" && p.kind !== "station" && p.kind !== "stop" ? styles.placeSecondary : ""}`}
              transform={`translate(${p.x},${p.y})`}
            >
              <title>
                {p.ru} ·{" "}
                {p.origin === "real"
                  ? "реальное место"
                  : p.origin === "lesson"
                    ? "из учебника"
                    : "учебная точка"}
              </title>
              {p.id === goal && (
                <>
                  <circle cy="-24" r="46" className={styles.goalHalo} />
                  <circle cy="-24" r="46" className={styles.goalPulse} />
                </>
              )}
              <rect
                x="-38"
                y="-66"
                width="76"
                height="110"
                className={styles.hit}
              />
              <g transform={`scale(${style === "district" ? 1.7 : 1.45})`}>
                <Building place={p} />
              </g>
              {(number >= 0 || style === "atlas") && (
                <g transform="translate(34,-58)" className={styles.badge}>
                  <circle
                    r="10"
                    className={number >= 0 ? styles.badgeOn : undefined}
                  />
                  <text y="4" textAnchor="middle">
                    {number >= 0 ? number : i + 1}
                  </text>
                </g>
              )}
              <text y="24" textAnchor="middle" className={styles.placeKo}>
                {p.ko}
              </text>
              {style !== "district" && (
                <text y="40" textAnchor="middle" className={styles.placeRu}>
                  {p.ru}
                </text>
              )}
            </g>
          );
        })}
        {actor && (
          <g
            transform={`translate(${actor.x},${actor.y})`}
            aria-label="Текущее положение"
            className={styles.actorGroup}
          >
            <circle r="17" className={styles.actorPulse} />
            <circle r="17" className={styles.actor} />
            <path
              d="M-7 -4 L7 -4 L0 9Z"
              className={styles.actorArrow}
              transform={`rotate(${rotation})`}
            />
          </g>
        )}
        <g transform="translate(1130,70)" aria-hidden="true">
          <circle r="26" className={styles.compassRing} />
          <path d="M0 -18 L6 0 L0 -4 L-6 0Z" className={styles.compassNorth} />
          <path d="M0 18 L6 0 L0 4 L-6 0Z" className={styles.compass} />
          <text y="-32" textAnchor="middle" className={styles.compassLabel}>
            N
          </text>
        </g>
      </svg>
      <div className={styles.zoom}>
        <button
          type="button"
          aria-label="Приблизить карту"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.5))}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Отдалить карту"
          onClick={() => {
            setZoom((z) => Math.max(1, z - 0.5));
            setCenter({ x: 600, y: H / 2 });
          }}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Карта целиком"
          onClick={() => {
            setZoom(1);
            setCenter({ x: 600, y: H / 2 });
          }}
        >
          ⌖
        </button>
      </div>
      {zoom > 1 && (
        <div className={styles.pan}>
          <button
            type="button"
            aria-label="Карта левее"
            onClick={() => pan(-100, 0)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Карта выше"
            onClick={() => pan(0, -80)}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Карта ниже"
            onClick={() => pan(0, 80)}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label="Карта правее"
            onClick={() => pan(100, 0)}
          >
            →
          </button>
        </div>
      )}
      <span className={styles.mapCredit}>
        Учебная схема · положение улиц и время условные
      </span>
    </div>
  );
}
