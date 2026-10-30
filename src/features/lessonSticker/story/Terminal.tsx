"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./StoryGame.module.css";

const RAIN_CHARS = "가나다라마바사아자차카타파하01옷색입신쓰매";
const COLUMNS = 14;

function rainColumn(seed: number): string {
  let out = "";
  for (let i = 0; i < 28; i++) out += RAIN_CHARS[(seed * 7 + i * 13 + i * i) % RAIN_CHARS.length] + "\n";
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** «Матричный» дождь из хангыля и цифр. className задаёт маску и яркость. */
export function MatrixRain({ className }: { className?: string }) {
  return (
    <div className={`${styles.rain} ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: COLUMNS }, (_, i) => (
        <pre
          key={i}
          className={styles.rainColumn}
          style={{ left: `${(i / COLUMNS) * 100 + 2}%`, animationDelay: `${-((i * 1.7) % 9)}s` }}
        >
          {rainColumn(i)}
        </pre>
      ))}
    </div>
  );
}

/** Секундный тик для часов и «плавающих» показателей канала; paused —
 * время застывает (например, после конца звонка). */
export function useTick(paused = false): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [paused]);
  return now;
}

function randomStatus() {
  return {
    bars: 3 + Math.floor(Math.random() * 2),
    freq: (2.4 + Math.random() * 0.08).toFixed(2),
    ping: 18 + Math.floor(Math.random() * 22),
    loss: (Math.random() * 0.6).toFixed(1),
  };
}

/** Показатели канала, обновляются раз в секунду. title + withTimer —
 * заголовок с длительностью соединения; ended — соединение закрыто:
 * таймер застывает, показатели гаснут. */
export function ChannelStatus({
  title,
  withTimer,
  ended = false,
  className,
}: {
  title?: string;
  withTimer?: boolean;
  ended?: boolean;
  className?: string;
}) {
  const now = useTick(ended);
  const [start] = useState(() => Date.now());
  const [status, setStatus] = useState(randomStatus);

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => setStatus(randomStatus()), 1000);
    return () => clearInterval(timer);
  }, [ended]);

  const elapsed = Math.max(0, Math.floor((now.getTime() - start) / 1000));
  const off = "—";
  const rows: [string, ReactNode][] = [
    [
      "SIGNAL",
      <span key="bars" className={styles.bars}>
        {[1, 2, 3, 4].map((b) => (
          <i key={b} className={!ended && b <= status.bars ? styles.barOn : undefined} />
        ))}
      </span>,
    ],
    ["FREQ", ended ? off : `${status.freq} GHz`],
    ["ENC", ended ? "CLOSED" : "AES-256"],
    ["PING", ended ? off : `${status.ping} ms`],
  ];
  if (withTimer) rows.push(["LOSS", ended ? off : `${status.loss}%`]);

  return (
    <div className={`${styles.status} ${ended ? styles.statusEnded : ""} ${className ?? ""}`}>
      {title && (
        <div className={styles.statusHead}>
          <span>{ended ? "■ CALL ENDED" : title}</span>
          {withTimer && (
            <span>
              {pad(Math.floor(elapsed / 60))}:{pad(elapsed % 60)}
            </span>
          )}
        </div>
      )}
      <dl className={styles.statusRows}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Clock({ className, dateClassName }: { className?: string; dateClassName?: string }) {
  const now = useTick();
  return (
    <span className={className}>
      <span className={dateClassName}>
        {now.getFullYear()}-{pad(now.getMonth() + 1)}-{pad(now.getDate())}{" "}
      </span>
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </span>
  );
}
