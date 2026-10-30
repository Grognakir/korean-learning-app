"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../SolomonOs.module.css";

const PROMPT = "solomon@seoul:~$ ";

const CMDS: Record<string, () => string> = {
  help: () => "help · whoami · date · ls · hello · clear",
  whoami: () => "solomon — 서울에 온 지 3일 (3 дня в Сеуле)",
  date: () => "2026년 10월 30일 목요일 · 오후 3:20",
  ls: () => "메시지/  전화/  쇼핑/  터미널/  설정/  ???/",
  hello: () => "안녕하세요! 👋",
};

type Line = { text: string; dim?: boolean };

/** Терминал из макета: несколько команд для атмосферы. */
export function Terminal({ phone }: { phone: boolean }) {
  const [lines, setLines] = useState<Line[]>([
    { text: "Solomon OS 0.1 — 'help' 를 입력하세요", dim: true },
  ]);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!phone) input.current?.focus();
  }, [phone]);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines]);

  const run = () => {
    const v = value.trim();
    setValue("");
    if (v === "clear") return setLines([]);
    setLines((l) => [
      ...l,
      { text: PROMPT + v },
      ...(v
        ? [
            CMDS[v]
              ? { text: CMDS[v]() }
              : {
                  text: `${v}: 명령을 찾을 수 없어요 (команда не найдена)`,
                  dim: true,
                },
          ]
        : []),
    ]);
  };

  return (
    <div
      className={styles.term}
      ref={box}
      onClick={() => input.current?.focus()}
    >
      {lines.map((l, i) => (
        <div key={i} className={`${styles.line} ${l.dim ? styles.dim : ""}`}>
          {l.text}
        </div>
      ))}
      <div className={styles.line}>
        <span className={styles.prompt}>{PROMPT}</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          autoComplete="off"
          spellCheck={false}
          aria-label="Команда"
        />
      </div>
    </div>
  );
}
