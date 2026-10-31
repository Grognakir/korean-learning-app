"use client";

import { useEffect, useRef, useState } from "react";
import { JIA_AVATAR } from "../apps";
import { createOsStore, type OsStore } from "../store";
import { useOsStore } from "../OsStorage";
import styles from "../SolomonOs.module.css";

/** Тестовый диалог из макета desktop.html (заглушка до пролога). */
type Node = { jia: [string, string][]; replies: [string, string, string][] };

export const SCRIPT: Record<string, Node> = {
  start: {
    jia: [
      ["안녕! 서울은 어때요?", "Привет! Как тебе Сеул?"],
      ["지금 뭐 해요?", "Что сейчас делаешь?"],
    ],
    replies: [
      ["한국어를 공부해요.", "Учу корейский.", "study"],
      ["집에 있어요.", "Я дома.", "home"],
      ["지금 가요!", "Уже иду!", "go"],
    ],
  },
  study: {
    jia: [["와, 대단해요! 어려워요?", "Ого, круто! Сложно?"]],
    replies: [
      ["네, 조금 어려워요.", "Да, немного сложно.", "end"],
      ["아니요, 재미있어요!", "Нет, интересно!", "end"],
    ],
  },
  home: {
    jia: [["그럼 같이 쇼핑 갈래요?", "Тогда пойдём вместе по магазинам?"]],
    replies: [
      ["좋아요!", "Давай!", "end"],
      ["미안해요, 피곤해요.", "Прости, я устал.", "end"],
    ],
  },
  go: {
    jia: [["어디에 가요? ㅋㅋ", "Куда идёшь? Ха-ха"]],
    replies: [
      ["지아 집에 가요!", "К тебе домой!", "end"],
      ["몰라요 ㅋㅋ", "Не знаю, ха-ха", "end"],
    ],
  },
  end: {
    jia: [["ㅋㅋㅋ 알겠어요. 이따 봐요!", "Ха-ха, поняла. Увидимся!"]],
    replies: [],
  },
};

export type ChatState = {
  node: string;
  log: ["in" | "out", string, string][];
  shown: boolean;
  pending: [string, string][];
};

export const CHAT_KEY = "chat";
export const freshChat = (): ChatState => ({
  node: "start",
  log: [],
  shown: false,
  pending: [...SCRIPT.start.jia],
});

export function readChat(store: OsStore = createOsStore()): ChatState {
  const c = store.load<ChatState | null>(CHAT_KEY, null);
  if (!c || !SCRIPT[c.node] || !Array.isArray(c.log)) return freshChat();
  const delivered = c.log.slice(c.log.findLastIndex(([who]) => who === "out") + 1).filter(([who]) => who === "in").length;
  return { ...c, pending: Array.isArray(c.pending) ? c.pending : SCRIPT[c.node].jia.slice(delivered) };
}

export function Messenger({
  phone,
  onRead,
}: {
  phone: boolean;
  onRead: () => void;
}) {
  const store = useOsStore();
  const [chat, setChat] = useState<ChatState>(() => ({ ...readChat(store), shown: true }));
  const [inChat, setInChat] = useState(phone);
  const [showRu, setShowRu] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const onReadRef = useRef(onRead);
  const typing = chat.pending.length > 0;

  useEffect(() => store.save(CHAT_KEY, chat), [chat, store]);
  useEffect(() => {
    msgsRef.current?.scrollTo?.({ top: msgsRef.current.scrollHeight });
  }, [chat.log.length, typing]);
  useEffect(() => { onReadRef.current(); }, []);
  useEffect(() => {
    if (!chat.pending.length) return;
    const timer = setTimeout(() => {
      setChat((c) => {
        const [next, ...pending] = c.pending;
        return next ? { ...c, pending, log: [...c.log, ["in", next[0], next[1]]] } : c;
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [chat.pending]);

  const node = SCRIPT[chat.node];
  const last = chat.log.at(-1);

  const answer = (i: number) => {
    const [k, r, to] = node.replies[i];
    setChat((c) => ({ ...c, node: to, log: [...c.log, ["out", k, r]], pending: [...SCRIPT[to].jia] }));
  };

  return (
    <div
      className={[styles.msgr, inChat && styles.inChat, showRu && styles.showRu]
        .filter(Boolean)
        .join(" ")}
    >
      <aside className={`${styles.list} kr`}>
        <h3>메시지</h3>
        <button
          type="button"
          className={`${styles.chatItem} ${styles.chatItemOn}`}
          onClick={() => setInChat(true)}
        >
          <span className={styles.ava}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.holo} src={JIA_AVATAR} alt="" />
          </span>
          <span className={styles.meta}>
            <b>지아</b>
            <small>{last?.[1] ?? ""}</small>
          </span>
          <span className={styles.time}>15:20</span>
        </button>
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`${styles.chatItem} ${styles.chatItemLocked}`}
          >
            <span className={styles.ava} />
            <span className={styles.meta}>
              <b>???</b>
              <small>🔒</small>
            </span>
          </div>
        ))}
      </aside>
      <div className={styles.chat}>
        <div className={styles.chatHead}>
          <button
            type="button"
            className={styles.back}
            aria-label="Назад к чатам"
            onClick={() => setInChat(false)}
          >
            ‹
          </button>
          <span className={styles.ava}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.holo} src={JIA_AVATAR} alt="" />
          </span>
          <div>
            <b className="kr">지아</b>
            <small className="kr">● 온라인</small>
          </div>
          <button
            type="button"
            className={styles.ru}
            aria-pressed={showRu}
            onClick={() => setShowRu((v) => !v)}
          >
            RU
          </button>
        </div>
        <div className={`${styles.msgs} kr`} ref={msgsRef}>
          {chat.log.map(([who, ko, ru], i) => (
            <div
              key={i}
              className={`${styles.msg} ${who === "out" ? styles.msgOut : styles.msgIn}`}
            >
              {ko}
              <span className={styles.tr}>{ru}</span>
              <span className={styles.st}>
                {who === "out" ? "읽음 · " : ""}15:2{Math.min(9, i)}
              </span>
            </div>
          ))}
          {typing && (
            <div className={styles.typing}>
              지아 입력 중<i />
              <i />
              <i />
            </div>
          )}
        </div>
        <div className={`${styles.replies} kr`}>
          {typing ? null : node.replies.length ? (
            <>
              <span className={styles.lbl}>답장 선택</span>
              {node.replies.map(([k, r], i) => (
                <button
                  key={k}
                  type="button"
                  className={styles.reply}
                  onClick={() => answer(i)}
                >
                  {k}
                  <span className={styles.tr}>{r}</span>
                </button>
              ))}
            </>
          ) : (
            <span className={styles.lbl}>
              대화 끝 ·{" "}
              <button
                type="button"
                onClick={() => {
                  setChat({ ...freshChat(), shown: true });
                }}
              >
                처음부터
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
