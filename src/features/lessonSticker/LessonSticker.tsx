"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Modal } from "@/components/ui/Modal";
import type { LessonSticker as LessonStickerConfig } from "@/features/learning/types";
import { CHARACTERS, emotionSrc, type Emotion } from "./characters";
import { readProgress, subscribeProgress } from "./progress";
import { TRAINERS } from "./trainers";
import styles from "./LessonSticker.module.css";

/** Кнопка-стикер урока в правом нижнем углу экрана. Пока тренажёр не
 * пройден, стикер время от времени «звонит». */
export function LessonSticker({ config }: { config: LessonStickerConfig }) {
  const character = CHARACTERS[config.character];
  const trainer = TRAINERS[config.trainer];
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [beat, setBeat] = useState<"idle" | "blink" | "ringing">("idle");
  const preloaded = useRef(false);

  const doneCount = useSyncExternalStore(
    subscribeProgress,
    () => readProgress(config.trainer).length,
    () => 0,
  );
  const allDone = Boolean(trainer) && doneCount >= trainer.total;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let tick = 0;
    const schedule = () => {
      timer = setTimeout(() => {
        tick += 1;
        const ring = !allDone && tick % 3 === 0;
        setBeat(ring ? "ringing" : "blink");
        timer = setTimeout(
          () => {
            setBeat("idle");
            schedule();
          },
          ring ? 1400 : 150,
        );
      }, 3500 + Math.random() * 1500);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [allDone]);

  const preload = useCallback(() => {
    if (preloaded.current || !character) return;
    preloaded.current = true;
    for (const emotion of character.emotions) {
      const img = new Image();
      img.src = emotionSrc(character, emotion);
    }
  }, [character]);

  if (!character || !trainer) return null;

  const emotion: Emotion = hover ? "hover" : beat;
  const { Component } = trainer;

  return (
    <>
      <button
        type="button"
        className={`${styles.sticker} ${emotion === "ringing" ? styles.ringing : ""}`}
        onClick={() => {
          preload();
          setOpen(true);
        }}
        onMouseEnter={() => {
          preload();
          setHover(true);
        }}
        onMouseLeave={() => setHover(false)}
        onFocus={preload}
        aria-label={trainer.title}
        title={trainer.title}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={emotionSrc(character, emotion)} alt="" className={styles.face} draggable={false} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={trainer.title}
        maxWidth={980}
        maxHeight={900}
        anchorHeight={720}
        className={styles.terminal}
      >
        <Component />
      </Modal>
    </>
  );
}
