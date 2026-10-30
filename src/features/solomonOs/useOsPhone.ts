import { useSyncExternalStore } from "react";

/** Узкий экран ОС: окна всегда развёрнуты, иконки мельче (как в макете). */
export const OS_PHONE = "(max-width: 760px)";

export function useOsPhone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!window.matchMedia) return () => {};
      const mq = window.matchMedia(OS_PHONE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => Boolean(window.matchMedia?.(OS_PHONE).matches),
    () => false,
  );
}

/** Время по-корейски: «오후 3:20». */
export function koTime(d: Date): string {
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}
