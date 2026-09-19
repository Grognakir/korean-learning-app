"use client";

import { useEffect, useRef, useState } from "react";

/** Отслеживает, какая карточка сейчас видна в горизонтальном
 * scroll-snap-контейнере (карусель на мобильном), и даёт функцию для
 * прокрутки к конкретному индексу — общая логика для PhraseGallery и
 * countryGrid. */
export function useCarouselIndex<T extends HTMLElement>(count: number) {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const width = el.clientWidth;
      if (!width) return;
      const index = Math.round(el.scrollLeft / width);
      setActive(Math.min(count - 1, Math.max(0, index)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  function scrollTo(index: number) {
    ref.current?.scrollTo({ left: index * ref.current.clientWidth, behavior: "smooth" });
  }

  return { ref, active, scrollTo };
}
