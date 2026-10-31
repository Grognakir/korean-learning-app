import { useEffect, useState, type RefObject } from "react";

/** Граница мобильной раскладки игры — та же, что у `@container game` в
 * StoryGame.module.css. */
export const COMPACT_WIDTH = 640;

/** Окно ОС уже, чем 5:4 (`max-aspect-ratio: 5 / 4` в CSS), — тоже раскладка
 * телефона: рядом с продавцом не помещается даже один манекен. */
const TALL_RATIO = 5 / 4;

/** Ширина полки в два столбца плиток с отступами (см. .shelfSheet в wide). */
const WIDE_SHELF = 310;

export type ShopLayout = "wide" | "two" | "single";

/** Сколько манекенов ставить рядом с продавцом, не уменьшая фигуры: оба,
 * если помещаются в полный рост между продавцом и корзиной, иначе один с
 * переключателем. Если рядом с двумя манекенами остаётся место хотя бы на
 * два столбца плиток — «wide»: манекены у продавца, полка панелью справа.
 * Пропорции — как в StoryGame.module.css: продавец 72% высоты сцены шириной
 * (из них 15% — прозрачное поле), манекен 88% высоты при 2:3, справа 214px
 * под корзину. */
export function useShopLayout(ref: RefObject<HTMLElement | null>): ShopLayout {
  const [layout, setLayout] = useState<ShopLayout>("two");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const free = w * 0.985 - h * 0.72 * 0.85 - 214;
      const two = 2 * (h * 0.88 * (2 / 3));
      // В wide манекены заходят друг на друга (--mq-overlap в CSS).
      const overlap = Math.min(0, Math.max(-0.07 * h, 44 - 0.1485 * h));
      const packed = h * 1.174 + 4 * overlap;
      setLayout(
        free >= packed + WIDE_SHELF
          ? "wide"
          : free >= two - 40
            ? "two"
            : "single",
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return layout;
}

/** Узкий экран игры: меряется ширина экрана игры (контейнера `.screen`), в
 * котором лежит элемент, а не окна браузера — так магазин перестраивается и в
 * узком окне Solomon OS. */
export function useCompact(ref: RefObject<HTMLElement | null>): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const screen =
      (el.closest("[data-game-screen]") as HTMLElement | null) ?? el;
    // Как у container query: ширина содержимого, без отступов.
    const measure = () => {
      const cs = getComputedStyle(screen);
      const w =
        screen.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);
      const h =
        screen.clientHeight -
        parseFloat(cs.paddingTop) -
        parseFloat(cs.paddingBottom);
      // Окно ОС (контейнер по обеим осям): высокое узкое — тоже телефонная раскладка.
      const tall = cs.containerType === "size" && h > 0 && w <= h * TALL_RATIO;
      setCompact(w > 0 && (w <= COMPACT_WIDTH || tall));
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
