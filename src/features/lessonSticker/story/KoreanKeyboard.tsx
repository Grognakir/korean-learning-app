"use client";

import { useEffect, useRef, useState } from "react";
import { LAYOUT, SHIFTED } from "./hangul";
import styles from "./StoryGame.module.css";

/** Своя экранная клавиатура 두벌식 для телефона: вместо системной, у которой
 * Safari показывает свои строки и сдвигает страницу. Кнопки не забирают
 * фокус; ⇧ — на одно нажатие; ⌫ при удержании стирает повторно. */
export function KoreanKeyboard({
  onJamo,
  onSpace,
  onBackspace,
  onSend,
}: {
  onJamo: (jamo: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
  onSend: () => void;
}) {
  const [shift, setShift] = useState(false);
  const repeat = useRef<{ wait?: number; tick?: number }>({});
  const stop = () => {
    window.clearTimeout(repeat.current.wait);
    window.clearInterval(repeat.current.tick);
    repeat.current = {};
  };
  useEffect(() => stop, []);

  const press = (e: React.PointerEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  return (
    <div
      className={styles.krKeyboard}
      role="group"
      aria-label="Корейская клавиатура"
    >
      {LAYOUT.map((row, r) => (
        <div key={r} className={styles.krRow}>
          {r === 2 && (
            <button
              type="button"
              className={`${styles.krKey} ${styles.krKeyWide} ${shift ? styles.krKeyOn : ""}`}
              aria-label="Shift"
              aria-pressed={shift}
              onPointerDown={(e) => press(e, () => setShift((v) => !v))}
            >
              ⇧
            </button>
          )}
          {row.map((base) => {
            const jamo = shift ? (SHIFTED[base] ?? base) : base;
            return (
              <button
                key={base}
                type="button"
                className={`${styles.krKey} kr`}
                onPointerDown={(e) =>
                  press(e, () => {
                    onJamo(jamo);
                    setShift(false);
                  })
                }
              >
                {jamo}
              </button>
            );
          })}
          {r === 2 && (
            <button
              type="button"
              className={`${styles.krKey} ${styles.krKeyWide}`}
              aria-label="Стереть"
              onPointerDown={(e) =>
                press(e, () => {
                  onBackspace();
                  stop();
                  repeat.current.wait = window.setTimeout(() => {
                    repeat.current.tick = window.setInterval(onBackspace, 70);
                  }, 400);
                })
              }
              onPointerUp={stop}
              onPointerLeave={stop}
              onPointerCancel={stop}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className={styles.krRow}>
        <button
          type="button"
          className={`${styles.krKey} ${styles.krSpace} kr`}
          aria-label="Пробел"
          onPointerDown={(e) => press(e, onSpace)}
        >
          띄어쓰기
        </button>
        <button
          type="button"
          className={`${styles.krKey} ${styles.krSend} kr`}
          aria-label="Отправить"
          onPointerDown={(e) => press(e, onSend)}
        >
          보내기 ↵
        </button>
      </div>
    </div>
  );
}
