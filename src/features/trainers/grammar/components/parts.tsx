import type { InputHTMLAttributes, ReactNode } from "react";
import type { GrammarDrill } from "../types";
import styles from "./GrammarTrainer.module.css";

export function scrollToTop() {
  window.scrollTo({ top: 0 });
}

export function Dock({ children }: { children: ReactNode }) {
  return <div className={styles.dock}>{children}</div>;
}

export function DrillPrompt({ drill }: { drill: GrammarDrill }) {
  return (
    <>
      <p className={`${styles.sentence} kr`}>{drill.base_kr}</p>
      <p className={styles.muted}>{drill.base_ru}</p>
      <p className={styles.task}>{drill.task_ru}</p>
    </>
  );
}

export function KoreanInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      lang="ko"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder="Напишите по-корейски"
      {...props}
      className={`${styles.input} kr`}
    />
  );
}

export function AnswerReview({ ok, task, yours, answers }: { ok: boolean; task?: string; yours: string; answers: string[] }) {
  return (
    <div className={styles.review}>
      <p className={ok ? styles.verdictOk : styles.verdictBad}>{ok ? "Верно" : "Неверно"}</p>
      {task && <p className={styles.muted}>{task}</p>}
      {!ok && <p className={`${styles.yours} kr`}><s>{yours.trim() || "— пусто —"}</s></p>}
      <p className={`${styles.right} kr`}>{answers[0]}</p>
      {answers.length > 1 && <p className={`${styles.muted} kr`}>также верно: {answers.slice(1).join(" · ")}</p>}
    </div>
  );
}
