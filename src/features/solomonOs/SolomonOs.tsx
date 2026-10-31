"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OutfitPiece } from "../lessonSticker/clothing/situations";
import { HologramFilter } from "../lessonSticker/story/Character";
import { IncomingScreen } from "../lessonSticker/story/IncomingScreen";
import {
  StoryGame,
  type StorySnapshot,
} from "../lessonSticker/story/StoryGame";
import storyStyles from "../lessonSticker/story/StoryGame.module.css";
import { APP_BY_ID, APPS, JIA_AVATAR, type AppId } from "./apps";
import { Messenger, readChat } from "./apps/Messenger";
import { Phone, type ActiveCall } from "./apps/Phone";
import { Locked, Settings } from "./apps/Settings";
import { Shop } from "./apps/Shop";
import { Notes } from "./apps/Notes";
import { MapApp } from "./map/MapApp";
import { freshWorkspace, type MapWorkspace } from "./map/missions";
import { routeNote, shoppingNote, type MissionNote } from "./missions";
import { Terminal } from "./apps/Terminal";
import { Desktop } from "./Desktop";
import { NoteBell } from "./NoteBell";
import {
  makeNote,
  markNotesRead,
  NOTES_KEY,
  pushNote,
  type OsNote,
} from "./notifications";
import { Toast } from "./Toast";
import { AppIcon, OsIcon } from "./icons";
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
import { OsStorageProvider, useOsStore } from "./OsStorage";
import {
  episodeById,
  meetingRange,
  reminderEpisode,
  SCHEDULED_TRAINERS,
  trainerById,
  type OsTask,
} from "./trainers";
import { koTime, useKeyboardViewport, useOsDevice } from "./useOsPhone";
import { clampGeo, OsWindow, type Geo, type WinState } from "./Window";
import styles from "./SolomonOs.module.css";

type Sys = { schedule: ScheduleState; log: CallEntry[]; ring: Ring | null };
type Wins = Partial<Record<AppId, WinState>>;

const TICK_MS = 1000;

/** Звонки, задание и окна ОС. Состояние — в браузере (store.ts). */
export function SolomonOs({ userId }: { userId?: string } = {}) {
  return (
    <OsStorageProvider userId={userId}>
      <OsDesktop key={userId ?? "local"} />
    </OsStorageProvider>
  );
}

function OsDesktop() {
  const store = useOsStore();
  const { load, save } = store;
  const [call, setCall] = useState<ActiveCall | null>(() => {
    const saved = load<{
      trainerId: string;
      episodeId: string;
      snapshot?: StorySnapshot;
      reminder?: boolean;
    } | null>("activeCall", null);
    const found = saved && episodeById(saved.episodeId);
    const episode = found && saved.reminder ? reminderEpisode(found) : found;
    return saved && episode && trainerById(saved.trainerId)
      ? {
          trainerId: saved.trainerId,
          episode,
          snapshot: saved.snapshot,
          reminder: saved.reminder,
        }
      : null;
  });
  const device = useOsDevice();
  const phone = device === "phone";
  const rootRef = useRef<HTMLDivElement>(null);
  useKeyboardViewport(rootRef);
  const [desk, setDesk] = useState({ w: 0, h: 0 });
  const [wins, setWins] = useState<Wins>(() =>
    call
      ? {
          call: {
            g: { x: 20, y: 20, w: 860, h: 680 },
            max: false,
            min: false,
            z: 11,
          },
        }
      : {},
  );
  const [focus, setFocus] = useState<AppId | null>(call ? "call" : null);
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
  const [workspace, setWorkspace] = useState<MapWorkspace>(() =>
    load("routeWorkspace", freshWorkspace()),
  );
  const [archive, setArchive] = useState<MissionNote[]>(() =>
    load("missionArchive", []),
  );
  const [task, setTask] = useState<OsTask | null>(() =>
    load<OsTask | null>("task", null),
  );
  const [meeting, setMeeting] = useState(() => load("meeting", false));
  const [meetingSnapshot, setMeetingSnapshot] = useState<StorySnapshot | null>(
    () => load("meetingSnapshot", null),
  );
  const [msgUnread, setMsgUnread] = useState(() =>
    readChat(store).shown ? 0 : 1,
  );
  const [notes, setNotes] = useState<OsNote[]>(() =>
    load<OsNote[]>(NOTES_KEY, []),
  );
  const [toastId, setToastId] = useState<string | null>(null);
  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  });
  // Сколько пропущенных было до входа: новые — повод для уведомления.
  const [missedBefore] = useState(() =>
    unseenMissed(load<CallEntry[]>("calls", [])),
  );
  const missedSeen = useRef(missedBefore);
  const [clock, setClock] = useState(() => koTime(new Date()));

  useEffect(() => {
    savedGeo.current = load("windows", {});
  }, [load]);
  useEffect(
    () =>
      save(
        "activeCall",
        call
          ? {
              trainerId: call.trainerId,
              episodeId: call.episode.id,
              snapshot: call.snapshot,
              reminder: call.reminder,
            }
          : null,
      ),
    [call, save],
  );
  useEffect(() => save("routeWorkspace", workspace), [workspace, save]);
  useEffect(() => save("missionArchive", archive), [archive, save]);
  useEffect(() => save("meeting", meeting), [meeting, save]);
  useEffect(
    () => save("meetingSnapshot", meetingSnapshot),
    [meetingSnapshot, save],
  );
  useEffect(() => save("schedule", sys.schedule), [sys.schedule, save]);
  useEffect(() => save("calls", sys.log), [sys.log, save]);
  useEffect(() => save("task", task), [task, save]);
  useEffect(() => save(NOTES_KEY, notes), [notes, save]);

  /** Новое уведомление: баннер сверху и запись под колокольчиком. */
  const notify = useCallback((note: Omit<OsNote, "id" | "at" | "read">) => {
    const n = makeNote(note, Date.now());
    setNotes((l) => pushNote(l, n));
    setToastId(n.id);
  }, []);

  // Новый пропущенный (при входе или пока ОС открыта) — уведомление.
  const missedNow = unseenMissed(sys.log);
  const missedFrom = sys.log.findLast(
    (e) => e.kind === "missed" && !e.seen,
  )?.trainerId;
  useEffect(() => {
    if (missedNow <= missedSeen.current) {
      missedSeen.current = missedNow;
      return;
    }
    // Счётчик обновляется в момент показа: повторный запуск эффекта (Strict
    // Mode, перерисовка) не должен «съесть» уведомление.
    const t = setTimeout(() => {
      missedSeen.current = missedNow;
      notify({
        who: "지아",
        text: `부재중 전화 ${missedNow}통`,
        app: "call",
        trainerId: missedFrom,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [missedNow, missedFrom, notify]);

  // Первое сообщение 지아 в мессенджере — одно уведомление.
  useEffect(() => {
    if (
      !msgUnread ||
      notesRef.current.some((n) => n.app === "msg") ||
      missedNow > missedBefore
    )
      return;
    const t = setTimeout(
      () => notify({ who: "지아", text: "뭐 해요? 😊", app: "msg" }),
      900,
    );
    return () => clearTimeout(t);
    // только при входе
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Открыли приложение — его уведомления прочитаны, баннер убирается.
      const own = notesRef.current.filter((n) => n.app === id).map((n) => n.id);
      if (own.length) {
        setNotes((l) => markNotesRead(l, own));
        setToastId((t) => (t && own.includes(t) ? null : t));
      }
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
      savedGeo.current[id] = {
        ...clampGeo(s.g, desk, APP_BY_ID[id]),
        max: s.max,
      };
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
    if (call?.trainerId === trainerId) {
      openApp("call");
      return;
    }
    // Задание уже дано — 지아 помнит разговор и только напоминает просьбу.
    const same =
      task?.trainerId === trainerId ? episodeById(task.episodeId) : undefined;
    if (same) {
      setCall({ trainerId, episode: reminderEpisode(same), reminder: true });
      openApp("call");
      return;
    }
    const episode = trainer.pickEpisode(
      load<string | null>("lastEpisode", null),
    );
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

  /** Нажатие на уведомление: пропущенный звонок — сразу перезвонить, как на
   * телефоне; остальное — открыть приложение. */
  const openNote = (n: OsNote) => {
    if (n.app === "call" && n.trainerId) callBack(n.trainerId);
    else openApp(n.app);
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
    if (call.reminder) {
      setCall(null);
      return;
    }
    setTask((prev) => ({
      id:
        prev?.episodeId === call.episode.id
          ? prev.id
          : `shopping-${Date.now()}`,
      assignedAt:
        prev?.episodeId === call.episode.id ? prev.assignedAt : Date.now(),
      trainerId: call.trainerId,
      episodeId: call.episode.id,
      cart: prev?.episodeId === call.episode.id ? prev.cart : [],
    }));
    setCall(null);
    notify({ who: "쇼핑", text: "지아의 부탁 — 옷을 사러 가요", app: "shop" });
  };

  const finishMeeting = (ok: boolean) => {
    setMeeting(false);
    if (!ok || !task) return;
    const completedEpisode = episodeById(task.episodeId);
    if (completedEpisode) {
      const note = { ...shoppingNote(task, completedEpisode), completed: true };
      setArchive((prev) => [...prev.filter((n) => n.id !== note.id), note]);
    }
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
    notes: (task ? 1 : 0) + workspace.runs.filter((r) => !r.completed).length,
  };

  const toast = toastId ? notes.find((n) => n.id === toastId) : undefined;
  const meetingEpisode =
    meeting && task ? episodeById(task.episodeId) : undefined;
  const ringing = sys.ring && !call ? sys.ring : null;

  const currentEpisode = task && episodeById(task.episodeId);
  const missionNotes = [
    ...(task && currentEpisode ? [shoppingNote(task, currentEpisode)] : []),
    ...workspace.runs.map(routeNote),
    ...archive,
  ];
  const openMission = (note: MissionNote) => {
    if (note.routeRunId) {
      const run = workspace.runs.find((r) => r.id === note.routeRunId);
      if (run)
        setWorkspace((w) => ({
          ...w,
          mode: run.mode,
          scenarioId: run.scenarioId,
          active: { ...w.active, [run.mode]: run.id },
        }));
    }
    openApp(note.app);
  };

  const content = (id: AppId) => {
    switch (id) {
      case "msg":
        return <Messenger phone={phone} onRead={() => setMsgUnread(0)} />;
      case "notes":
        return <Notes notes={missionNotes} onOpen={openMission} />;
      case "map":
        return (
          <MapApp
            workspace={workspace}
            onChange={setWorkspace}
            onNotes={() => openApp("notes")}
          />
        );
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
            active={focus === "call" && !wins.call?.min && !meeting && !ringing}
            onSnapshot={(snapshot) =>
              setCall((current) =>
                current ? { ...current, snapshot } : current,
              )
            }
          />
        );
      case "shop":
        return (
          <Shop
            task={task}
            onCart={(cart: OutfitPiece[]) =>
              setTask((t) => (t ? { ...t, cart } : t))
            }
            onPay={() => {
              setMeetingSnapshot(null);
              setMeeting(true);
            }}
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
    <div ref={rootRef} className={styles.os} data-device={device}>
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
              <AppIcon id={id} />
              {APP_BY_ID[id].ko}
            </button>
          ))}
        </div>
        <div className={`${styles.tray} kr`}>
          <NoteBell
            notes={notes}
            avatar={JIA_AVATAR}
            onOpenNote={openNote}
            onReadAll={() => setNotes((l) => markNotesRead(l))}
            onClear={() => {
              setNotes([]);
              setToastId(null);
            }}
          />
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
        {toast && (
          <Toast
            key={toast.id}
            note={toast}
            avatar={JIA_AVATAR}
            mobile={device !== "desktop"}
            onOpen={() => {
              setToastId(null);
              openNote(toast);
            }}
            onClose={() => setToastId(null)}
          />
        )}
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
              progressKey={`${store.userId ? `user:${store.userId}:` : ""}${trainerById(task.trainerId)?.progressKey ?? task.trainerId}`}
              range={meetingRange(meetingEpisode)}
              initialCart={task.cart}
              persist={false}
              initialSnapshot={meetingSnapshot}
              onSnapshotChange={setMeetingSnapshot}
              onFinish={finishMeeting}
              className={storyStyles.embedded}
            />
          </div>
        </div>
      )}
    </div>
  );
}
