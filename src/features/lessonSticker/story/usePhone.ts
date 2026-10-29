import { useSyncExternalStore } from "react";

const PHONE = "(max-width: 640px)";

/** Узкий экран телефона (та же граница, что в StoryGame.module.css). */
export function usePhone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!window.matchMedia) return () => {};
      const mq = window.matchMedia(PHONE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => Boolean(window.matchMedia?.(PHONE).matches),
    () => false,
  );
}
