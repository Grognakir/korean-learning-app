"use client";

import { useEffect, useRef, useState } from "react";
import { JIA_AVATAR } from "../apps";
import { load, save } from "../store";
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
};

export const CHAT_KEY = "chat";
export const freshChat = (): ChatState => ({
  node: "start",
  log: [],
  shown: false,
});

export function readChat(): ChatState {
  const c = load<ChatState | null>(CHAT_KEY, null);
  return c && SCRIPT[c.node] && Array.isArray(c.log) ? c : freshChat();
}

export function Messenger({
  phone,
  onRead,
}: {
  phone: boolean;
  onRead: () => void;
}) {
  // Первое открытие: переписка начинается с реплик 지아.
  const [intro] = useState(() => !readChat().shown);
  const [chat, setChat] = useState<ChatState>(() => ({
    ...readChat(),
    shown: true,
  }));
  const [inChat, setInChat] = useState(phone);
  const [showRu, setShowRu] = useState(false);
  const [typing, setTyping] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const queue = useRef<[string, string][]>([]);
  const introStarted = useRef(false);

  useEffect(() => save(CHAT_KEY, chat), [chat]);
  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight });
  }, [chat.log.length, typing]);

  // 지아 «печатает»: реплики из очереди по одной.
  const say = (lines: [string, string][]) => {
    queue.current = [...lines];
    const step = (): void => {
      const next = queue.current.shift();
      if (!next) {
        setTyping(false);
        return;
      }
      setTyping(true);
      setTimeout(() => {
        setChat((c) => ({ ...c, log: [...c.log, ["in", next[0], next[1]]] }));
        step();
      }, 900);
    };
    setTimeout(step, 0);
  };

  useEffect(() => {
    onRead();
    if (intro && !introStarted.current) {
      introStarted.current = true;
      say(SCRIPT.start.jia);
    }
    // только при открытии
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const node = SCRIPT[chat.node];
  const last = chat.log.at(-1);

  const answer = (i: number) => {
    const [k, r, to] = node.replies[i];
    setChat((c) => ({ ...c, node: to, log: [...c.log, ["out", k, r]] }));
    say(SCRIPT[to].jia);
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
                  say(SCRIPT.start.jia);
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
