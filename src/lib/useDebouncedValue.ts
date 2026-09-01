"use client";

import { useEffect, useState } from "react";

/**
 * Значение с задержкой (trailing edge). Сеттер возвращается наружу для
 * случаев, когда значение сбрасывается программно и ждать задержку
 * нельзя — иначе успеет уйти запрос со старым значением.
 */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debounced, setDebounced] as const;
}
