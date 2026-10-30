import { useEffect, useState, type RefObject } from "react";

/** Граница мобильной раскладки игры — та же, что у `@container game` в
 * StoryGame.module.css. */
export const COMPACT_WIDTH = 640;

/** Узкий экран игры: меряется ширина экрана игры (контейнера `.screen`), в
 * котором лежит элемент, а не окна браузера — так магазин перестраивается и в
 * узком окне Solomon OS. */
export function useCompact(ref: RefObject<HTMLElement | null>): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const screen = (el.closest("[data-game-screen]") as HTMLElement | null) ?? el;
    // Как у container query: ширина содержимого, без отступов.
    const measure = () => {
      const cs = getComputedStyle(screen);
      const w = screen.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setCompact(w > 0 && w <= COMPACT_WIDTH);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(screen);
    return () => ro.disconnect();
  }, [ref]);

  return compact;
}
