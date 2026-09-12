import type { ReactNode } from "react";

// **жирный** из текстов грамматики (explanation, rules, usage)
export function formatBold(text: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  );
}
