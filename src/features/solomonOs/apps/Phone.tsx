"use client";

import { useEffect } from "react";
import {
  StoryGame,
  type StorySnapshot,
} from "../../lessonSticker/story/StoryGame";
import storyStyles from "../../lessonSticker/story/StoryGame.module.css";
import type { Episode } from "../../lessonSticker/story/types";
import { useOsStore } from "../OsStorage";
import { OsIcon } from "../icons";
import type { CallEntry } from "../schedule";
import { callRange, trainerById } from "../trainers";
import { koTime } from "../useOsPhone";
import styles from "../SolomonOs.module.css";

export type ActiveCall = {
  trainerId: string;
  episode: Episode;
  snapshot?: StorySnapshot;
  /** Повторный звонок при уже данном задании — напоминание (reminderEpisode). */
  reminder?: boolean;
};

const KIND: Record<CallEntry["kind"], string> = {
  missed: "부재중 · пропущенный",
  incoming: "수신 · входящий",
  outgoing: "발신 · исходящий",
};

function when(at: number): string {
  const d = new Date(at);
  const today = new Date().toDateString() === d.toDateString();
  return today ? koTime(d) : `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 전화: журнал звонков; во время разговора — звонок 지아 из игры урока 10
 * (голограмма, окно реплик, RU) до «CALL ENDED». */
export function Phone({
  log,
  call,
  onCallBack,
  onCallEnd,
  onSeen,
  active = true,
  onSnapshot,
}: {
  log: CallEntry[];
  call: ActiveCall | null;
  onCallBack: (trainerId: string) => void;
  onCallEnd: () => void;
  onSeen: () => void;
  active?: boolean;
  onSnapshot?: (snapshot: StorySnapshot) => void;
}) {
  const { userId } = useOsStore();
  useEffect(() => {
    if (!call) onSeen();
  }, [call, log, onSeen]);

  if (call) {
    const trainer = trainerById(call.trainerId);
    return (
      <StoryGame
        key={`${call.episode.id}${call.reminder ? ":reminder" : ""}`}
        episode={call.episode}
        progressKey={`${userId ? `user:${userId}:` : ""}${trainer?.progressKey ?? call.trainerId}`}
        range={callRange(call.episode)}
        onRangeEnd={onCallEnd}
        persist={false}
        active={active}
        initialSnapshot={call.snapshot}
        onSnapshotChange={onSnapshot}
        className={storyStyles.embedded}
      />
    );
  }

  const rows = [...log].sort((a, b) => b.at - a.at);
  return (
    <div className={`${styles.phone} kr`}>
      <div className={styles.phoneHead}>
        <h3>최근 기록</h3>
        <small>Журнал звонков</small>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>Звонков пока нет.</p>
      ) : (
        <ul className={styles.callList}>
          {rows.map((e) => {
            const t = trainerById(e.trainerId);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  className={`${styles.callItem} ${e.kind === "missed" ? styles.callMissed : ""}`}
                  onClick={() => onCallBack(e.trainerId)}
                  aria-label={`${e.caller}: ${KIND[e.kind]}, перезвонить`}
                >
                  <span className={styles.ava}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {t && <img className={styles.holo} src={t.avatar} alt="" />}
                  </span>
                  <span className={styles.meta}>
                    <b>{e.caller}</b>
                    <small className={styles.callKind}>
                      {KIND[e.kind]} · {when(e.at)}
                    </small>
                  </span>
                  <span className={styles.callBack} aria-hidden="true">
                    <OsIcon name="call" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
