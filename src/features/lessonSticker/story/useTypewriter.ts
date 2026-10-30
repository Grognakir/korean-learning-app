"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 26;

function prefersInstant(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Печать текста по буквам; finish() — допечатать сразу. */
export function useTypewriter(text: string) {
  const [instant] = useState(prefersInstant);
  const [state, setState] = useState({ text, n: 0 });
  const n = state.text === text ? state.n : 0;

  useEffect(() => {
    if (instant || n >= text.length) return;
    const timer = setTimeout(() => setState({ text, n: n + 1 }), TYPE_MS);
    return () => clearTimeout(timer);
  }, [instant, n, text]);

  const done = instant || n >= text.length;
  return {
    shown: done ? text : text.slice(0, n),
    done,
    finish: () => setState({ text, n: text.length }),
  };
}
