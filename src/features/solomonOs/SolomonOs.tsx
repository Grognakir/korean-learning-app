"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OutfitPiece } from "../lessonSticker/clothing/situations";
import { HologramFilter } from "../lessonSticker/story/Character";
import { IncomingScreen } from "../lessonSticker/story/IncomingScreen";
import { StoryGame } from "../lessonSticker/story/StoryGame";
import storyStyles from "../lessonSticker/story/StoryGame.module.css";
import { APP_BY_ID, APPS, type AppId } from "./apps";
import { Messenger, readChat } from "./apps/Messenger";
import { Phone, type ActiveCall } from "./apps/Phone";
import { Locked, Settings } from "./apps/Settings";
import { Shop } from "./apps/Shop";
import { Terminal } from "./apps/Terminal";
import { Desktop } from "./Desktop";
import { OsIcon } from "./icons";
import {
  addOutgoing,
  afterPass,
  markSeen,
  reconcile,
  resolveRing,
  unseenMissed,
  type CallEntry,
  type Ring,
  type ScheduleState,
} from "./schedule";
import { load, save } from "./store";
import {
  episodeById,
  meetingRange,
  SCHEDULED_TRAINERS,
  trainerById,
  type OsTask,
} from "./trainers";
import { koTime, useOsPhone } from "./useOsPhone";
import { clampGeo, OsWindow, type Geo, type WinState } from "./Window";
import styles from "./SolomonOs.module.css";

type Sys = { schedule: ScheduleState; log: CallEntry[]; ring: Ring | null };
type Toast = { who: string; text: string; app: AppId; avatar?: string } | null;
type Wins = Partial<Record<AppId, WinState>>;

const TICK_MS = 1000;

/** Звонки, задание и окна ОС. Состояние — в браузере (store.ts). */
export function SolomonOs() {
  const phone = useOsPhone();
  const [desk, setDesk] = useState({ w: 0, h: 0 });
  const [wins, setWins] = useState<Wins>({});
  const [focus, setFocus] = useState<AppId | null>(null);
  const zTop = useRef(10);
  const savedGeo = useRef<Partial<Record<AppId, Geo & { max: boolean }>>>({});

  const [sys, setSys] = useState<Sys>(() => {
    const schedule = load<ScheduleState>("schedule", {});
    const log = load<CallEntry[]>("calls", []);
    // Время прошло, пока ОС была закрыта, — при входе сразу пропущенный.
    const r = reconcile(SCHEDULED_TRAINERS, schedule, log, Date.now(), {
      onOpen: true,
      ringing: null,
    });
    return { schedule, log: r.log, ring: null };
  });
  const [task, setTask] = useState<OsTask | null>(() =>
    load<OsTask | null>("task", null),
  );
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [meeting, setMeeting] = useState(false);
  const [msgUnread, setMsgUnread] = useState(() => (readChat().shown ? 0 : 1));
  const [toast, setToast] = useState<Toast>(null);
  const [clock, setClock] = useState(() => koTime(new Date()));

  useEffect(() => {
    savedGeo.current = load("windows", {});
  }, []);
  useEffect(() => save("schedule", sys.schedule), [sys.schedule]);
  useEffect(() => save("calls", sys.log), [sys.log]);
  useEffect(() => save("task", task), [task]);

  // Уведомление при входе: пропущенный звонок, иначе сообщение 지아.
  useEffect(() => {
    const t = setTimeout(() => {
      const missed = unseenMissed(sys.log);
      if (missed)
        setToast({ who: "지아", text: `부재중 전화 ${missed}통`, app: "call" });
      else if (msgUnread)
        setToast({ who: "지아", text: "뭐 해요? 😊", app: "msg" });
    }, 900);
    return () => clearTimeout(t);
    // только при входе
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  // Пока ОС открыта: пришло время — звонок; минута без ответа — пропущенный.
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(koTime(new Date()));
      setSys((prev) => {
        const now = Date.now();
        const r = reconcile(SCHEDULED_TRAINERS, prev.schedule, prev.log, now, {
          onOpen: false,
          ringing: prev.ring,
        });
        const next = r.ring ? resolveRing(r.log, r.ring, now, null) : r;
        if (next.log === prev.log && next.ring === prev.ring) return prev;
        return { ...prev, ...next };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // ---------- окна ----------

  const openApp = useCallback(
    (id: AppId) => {
      setToast((t) => (t?.app === id ? null : t));
      setWins((prev) => {
        const z = ++zTop.current;
        const cur = prev[id];
        if (cur) return { ...prev, [id]: { ...cur, min: false, z } };
        const app = APP_BY_ID[id];
        const n = Object.keys(prev).length;
        const s = savedGeo.current[id];
        const g: Geo = s
          ? { x: s.x, y: s.y, w: s.w, h: s.h }
          : {
              w: app.w,
              h: app.h,
              x: Math.max(10, (desk.w - app.w) / 2 + n * 26 - 40),
              y: Math.max(10, (desk.h - app.h) / 2 + n * 22 - 30),
            };
        return { ...prev, [id]: { g, max: Boolean(s?.max), min: false, z } };
      });
      setFocus(id);
    },
    [desk],
  );

  const topmost = (w: Wins, except?: AppId) =>
    (Object.entries(w) as [AppId, WinState][])
      .filter(([k, s]) => k !== except && !s.min)
      .sort((a, b) => b[1].z - a[1].z)[0]?.[0] ?? null;

  const persistGeo = (w: Wins) => {
    for (const [id, s] of Object.entries(w) as [AppId, WinState][]) {
      savedGeo.current[id] = { ...clampGeo(s.g, desk), max: s.max };
    }
    save("windows", savedGeo.current);
  };

  const updateWin =
    (id: AppId) => (patch: Partial<WinState>, persist?: boolean) =>
      setWins((prev) => {
        const cur = prev[id];
        if (!cur) return prev;
        const next = { ...prev, [id]: { ...cur, ...patch } };
        if (persist) persistGeo(next);
        return next;
      });

  const minimize = (id: AppId) =>
    setWins((prev) => {
      const next = { ...prev, [id]: { ...prev[id]!, min: true } };
      setFocus(topmost(next));
      return next;
    });

  const closeApp = (id: AppId) => {
    if (id === "call") setCall(null);
    setWins((prev) => {
      persistGeo(prev);
      const next = { ...prev };
      delete next[id];
      setFocus(topmost(next));
      return next;
    });
  };

  const focusWin = (id: AppId) => {
    if (focus === id) return;
    setFocus(id);
    setWins((prev) =>
      prev[id] ? { ...prev, [id]: { ...prev[id]!, z: ++zTop.current } } : prev,
    );
  };

  // ---------- звонки и задание ----------

  const startCall = (trainerId: string) => {
    const trainer = trainerById(trainerId);
    if (!trainer) return;
    const same =
      task?.trainerId === trainerId ? episodeById(task.episodeId) : undefined;
    const episode =
      same ?? trainer.pickEpisode(load<string | null>("lastEpisode", null));
    save("lastEpisode", episode.id);
    setCall({ trainerId, episode });
    openApp("call");
  };

  const callBack = (trainerId: string) => {
    const trainer = trainerById(trainerId);
    if (!trainer) return;
    setSys((prev) => ({
      ...prev,
      log: addOutgoing(
        prev.log,
        { id: trainer.id, caller: trainer.caller },
        Date.now(),
      ),
    }));
    startCall(trainerId);
  };

  const answer = (yes: boolean) => {
    const ring = sys.ring;
    if (!ring) return;
    setSys((prev) =>
      prev.ring
        ? { ...prev, ...resolveRing(prev.log, prev.ring, Date.now(), yes) }
        : prev,
    );
    if (yes) startCall(ring.trainerId);
  };

  const endCall = () => {
    if (!call) return;
    setTask((prev) => ({
      trainerId: call.trainerId,
      episodeId: call.episode.id,
      cart: prev?.episodeId === call.episode.id ? prev.cart : [],
    }));
    setCall(null);
    setToast({
      who: "쇼핑",
      text: "지아의 부탁 — 옷을 사러 가요",
      app: "shop",
    });
  };

  const finishMeeting = (ok: boolean) => {
    setMeeting(false);
    if (!ok || !task) return;
    // Одобрила: тренажёр пройден, следующее повторение по расписанию.
    setSys((prev) => ({
      ...prev,
      schedule: afterPass(prev.schedule, task.trainerId, Date.now()),
    }));
    setTask(null);
    closeApp("shop");
  };

  const onPhoneSeen = useCallback(
    () =>
      setSys((prev) =>
        unseenMissed(prev.log) ? { ...prev, log: markSeen(prev.log) } : prev,
      ),
    [],
  );

  const badges: Partial<Record<AppId, number>> = {
    call: unseenMissed(sys.log),
    msg: msgUnread,
    shop: task && !wins.shop ? 1 : 0,
  };

  const meetingEpisode =
    meeting && task ? episodeById(task.episodeId) : undefined;
  const ringing = sys.ring && !call ? sys.ring : null;

  const content = (id: AppId) => {
    switch (id) {
      case "msg":
        return <Messenger phone={phone} onRead={() => setMsgUnread(0)} />;
      case "term":
        return <Terminal phone={phone} />;
      case "set":
        return <Settings />;
      case "call":
        return (
          <Phone
            log={sys.log}
            call={call}
            onCallBack={callBack}
            onCallEnd={endCall}
            onSeen={onPhoneSeen}
          />
        );
      case "shop":
        return (
          <Shop
            task={task}
            onCart={(cart: OutfitPiece[]) =>
              setTask((t) => (t ? { ...t, cart } : t))
            }
            onPay={() => setMeeting(true)}
          />
        );
      default:
        return <Locked />;
    }
  };

  const title = (id: AppId) => {
    const app = APP_BY_ID[id];
    if (id === "msg") return `${app.ko} — 지아`;
    if (id === "call" && call)
      return `${app.ko} — ${trainerById(call.trainerId)?.caller ?? ""}`;
    return app.ko;
  };

  const open = (Object.entries(wins) as [AppId, WinState][]).sort(
    (a, b) =>
      APPS.findIndex((x) => x.id === a[0]) -
      APPS.findIndex((x) => x.id === b[0]),
  );

  return (
    <div className={styles.os}>
      <HologramFilter />
      <header className={styles.panel}>
        <div className={styles.logo}>
          <OsIcon name="seal" />
          <span className={styles.logoText}>Solomon OS</span>
        </div>
        <div className={styles.tasks}>
          {open.map(([id, s]) => (
            <button
              key={id}
              type="button"
              className={[
                styles.task,
                "kr",
                focus === id && !s.min && styles.taskActive,
                s.min && styles.taskMin,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (s.min) openApp(id);
                else if (focus === id) minimize(id);
                else focusWin(id);
              }}
            >
              <OsIcon name={APP_BY_ID[id].icon} />
              {APP_BY_ID[id].ko}
            </button>
          ))}
        </div>
        <div className={`${styles.tray} kr`}>
          <span>{clock}</span>
          <span className={styles.sig} aria-hidden="true">
            {[4, 7, 10, 12].map((h) => (
              <i key={h} style={{ height: h }} />
            ))}
          </span>
          <span className={styles.bat} aria-hidden="true">
            <i />
          </span>
          <Link
            href="/learning"
            className={styles.exit}
            aria-label="Выйти из Solomon OS"
            title="Выйти из Solomon OS"
          >
            <OsIcon name="power" />
          </Link>
        </div>
      </header>

      <Desktop phone={phone} badges={badges} onOpen={openApp} onSize={setDesk}>
        {open.map(([id, s]) => (
          <OsWindow
            key={id}
            app={APP_BY_ID[id]}
            title={title(id)}
            state={s}
            focused={focus === id}
            phone={phone}
            desk={desk}
            onFocus={() => focusWin(id)}
            onChange={updateWin(id)}
            onMinimize={() => minimize(id)}
            onClose={() => closeApp(id)}
          >
            {content(id)}
          </OsWindow>
        ))}
        <button
          type="button"
          className={`${styles.toast} ${toast ? styles.toastShow : ""} kr`}
          tabIndex={toast ? 0 : -1}
          aria-hidden={!toast}
          onClick={() => toast && openApp(toast.app)}
        >
          <span className={styles.ava}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.holo}
              src={trainerById("lesson10-clothes")?.avatar}
              alt=""
            />
          </span>
          <span>
            <b>{toast?.who}</b>
            <small>{toast?.text}</small>
          </span>
        </button>
      </Desktop>

      {ringing && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-label={`Входящий звонок: ${ringing.caller}`}
        >
          <div
            className={`${storyStyles.screen} ${storyStyles.screenIncoming} ${storyStyles.embedded}`}
          >
            <IncomingScreen
              caller={ringing.caller}
              avatar={trainerById(ringing.trainerId)?.avatar ?? ""}
              onStart={() => answer(true)}
            />
          </div>
          <button
            type="button"
            className={`${styles.decline} kr`}
            onClick={() => answer(false)}
          >
            거절 · Сбросить
          </button>
        </div>
      )}

      {meetingEpisode && task && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-label="Встреча с 지아"
        >
          <div>
            <StoryGame
              episode={meetingEpisode}
              progressKey={
                trainerById(task.trainerId)?.progressKey ?? task.trainerId
              }
              range={meetingRange(meetingEpisode)}
              initialCart={task.cart}
              persist={false}
              onFinish={finishMeeting}
              className={storyStyles.embedded}
            />
          </div>
        </div>
      )}
    </div>
  );
}
