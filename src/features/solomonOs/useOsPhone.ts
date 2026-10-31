import { useEffect, useSyncExternalStore, type RefObject } from "react";

/** Узкий экран ОС: окна всегда развёрнуты, иконки мельче (как в макете). */
export const OS_PHONE = "(max-width: 760px)";

const TOUCH = "(pointer: coarse)";

/** Как ведёт себя ОС: телефон — окна на весь экран, крупные кнопки и
 * уведомления как в iOS; планшет — окна, но кнопки под палец; компьютер —
 * как есть. Телефон — сенсорный экран с короткой стороной меньше 600px или
 * просто узкое окно (≤760px). */
export type OsDevice = "desktop" | "tablet" | "phone";

function readDevice(): OsDevice {
  const mm = window.matchMedia;
  if (!mm) return "desktop";
  const touch = mm(TOUCH).matches;
  const short = Math.min(window.screen.width, window.screen.height);
  if (mm(OS_PHONE).matches || (touch && short < 600)) return "phone";
  return touch ? "tablet" : "desktop";
}

export function useOsDevice(): OsDevice {
  return useSyncExternalStore(
    (onChange) => {
      if (!window.matchMedia) return () => {};
      const mqs = [window.matchMedia(OS_PHONE), window.matchMedia(TOUCH)];
      mqs.forEach((mq) => mq.addEventListener("change", onChange));
      window.addEventListener("resize", onChange);
      return () => {
        mqs.forEach((mq) => mq.removeEventListener("change", onChange));
        window.removeEventListener("resize", onChange);
      };
    },
    readDevice,
    () => "desktop",
  );
}

/** Экранная клавиатура iOS не уменьшает страницу, а сдвигает видимую область:
 * пока клавиатура открыта, ОС держится в видимой части (над ней) через
 * --vv-top / --vv-h. Страница под ОС не прокручивается и не «пружинит» при
 * оттягивании пальцем, фон у неё тёмный. */
export function useKeyboardViewport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const vv = window.visualViewport;
    const page = [document.documentElement, document.body];
    const keys = ["backgroundColor", "overflow", "overscrollBehavior"] as const;
    const prev = page.map((p) => keys.map((k) => p.style[k]));
    page.forEach((p) => {
      p.style.backgroundColor = "#0d1410";
      p.style.overflow = "hidden";
      p.style.overscrollBehavior = "none";
    });
    const apply = () => {
      if (!el || !vv) return;
      // Клавиатура — когда видимая часть заметно ниже страницы. Сравнивать
      // нужно с высотой самой страницы (clientHeight): window.innerHeight в
      // iOS при открытой клавиатуре уменьшается вместе с видимой частью.
      // Оттягивание страницы пальцем (offsetTop тоже меняется) ОС не двигает.
      const full = Math.max(
        document.documentElement.clientHeight,
        window.innerHeight,
      );
      if (full - vv.height > 120) {
        el.style.setProperty("--vv-top", `${Math.max(0, vv.offsetTop)}px`);
        el.style.setProperty("--vv-h", `${vv.height}px`);
        el.dataset.keyboard = "open";
        document.documentElement.dataset.keyboard = "open";
      } else {
        el.style.removeProperty("--vv-top");
        el.style.removeProperty("--vv-h");
        delete el.dataset.keyboard;
        delete document.documentElement.dataset.keyboard;
      }
    };
    // Палец двигает страницу только внутри блоков, которым есть что
    // прокручивать; иначе iOS тянет всю страницу и сверху виден чёрный зазор.
    const scrollable = (node: EventTarget | null) => {
      for (
        let n = node as HTMLElement | null;
        n && n !== el;
        n = n.parentElement
      ) {
        const cs = getComputedStyle(n);
        if (
          (/(auto|scroll)/.test(cs.overflowY) &&
            n.scrollHeight > n.clientHeight) ||
          (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth)
        )
          return true;
      }
      return false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !scrollable(e.target)) e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      delete document.documentElement.dataset.keyboard;
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      page.forEach((p, i) => keys.forEach((k, j) => (p.style[k] = prev[i][j])));
    };
  }, [ref]);
}

export function useOsPhone(): boolean {
  return useOsDevice() === "phone";
}

/** Время по-корейски: «오후 3:20». */
export function koTime(d: Date): string {
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}
