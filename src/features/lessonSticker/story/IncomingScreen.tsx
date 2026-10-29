"use client";

import { ChannelStatus, Clock, MatrixRain } from "./Terminal";
import styles from "./StoryGame.module.css";

/** Экран входящего звонка: «матричный» дождь, статус канала, часы и
 * карточка звонящего с кнопкой START. На телефоне панель канала стоит
 * внутри карточки (вверху справа её закрывал бы крестик). */
export function IncomingScreen({
  caller,
  avatar,
  onStart,
}: {
  caller: string;
  avatar: string;
  onStart: () => void;
}) {
  return (
    <>
      <MatrixRain className={styles.rainEdges} />

      <div className={styles.incomingTop}>
        <pre className={styles.boot}>{"> SYSTEM BOOT\n> LANGUAGE: KO\n> CHANNEL SECURE\n> READY"}</pre>
        <ChannelStatus className={styles.statusTop} />
      </div>

      <div className={styles.incoming}>
        <span className={styles.corners} aria-hidden="true" />
        <div className={styles.avatarRing}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" className={styles.incomingAvatar} />
        </div>
        <p className={styles.incomingTitle}>INCOMING CALL</p>
        <p className={`${styles.incomingKo} kr`}>수신 전화 · {caller}</p>
        <div className={styles.wave} aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.11}s` }} />
          ))}
        </div>
        <ChannelStatus className={styles.statusCard} />
        <button type="button" className={styles.startButton} onClick={onStart} autoFocus>
          [ START ]
        </button>
        <p className={styles.hint}>
          press Enter<span className={styles.cursor} />
        </p>
      </div>

      <div className={styles.incomingBottom}>
        <div className={styles.link}>
          <span>ESTABLISHING SECURE LINK</span>
          <span className={styles.linkBar}>
            <span />
          </span>
        </div>
        <Clock className={styles.clock} dateClassName={styles.clockDate} />
      </div>
    </>
  );
}
