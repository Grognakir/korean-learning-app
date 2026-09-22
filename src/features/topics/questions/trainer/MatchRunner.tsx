"use client";

import { useRef, useState } from "react";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import { MATCH_ROUNDS, WORDS, shuffle } from "./data";
import styles from "./Trainer.module.css";

type Slot = { wi: number; text: string };

function buildRound(roundIdx: number) {
  const idxs = MATCH_ROUNDS[roundIdx];
  return {
    left: shuffle(idxs.map((i): Slot => ({ wi: i, text: WORDS[i].kr }))),
    right: shuffle(idxs.map((i): Slot => ({ wi: i, text: WORDS[i].ru }))),
  };
}

export function MatchRunner({
  title,
  onBack,
  onNextLevel,
}: {
  title: string;
  onBack: () => void;
  onNextLevel?: () => void;
}) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState(() => buildRound(0));
  const [matched, setMatched] = useState<number[]>([]);
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const doneRef = useRef<HTMLHeadingElement>(null);

  function restart() {
    setRoundIdx(0);
    setRound(buildRound(0));
    setMatched([]);
    setSelLeft(null);
    setSelRight(null);
    setWrongPair(null);
    setMistakes(0);
  }

  if (roundIdx >= MATCH_ROUNDS.length) {
    return (
      <div className={styles.done}>
        <span className={styles.eyebrow}>Результат</span>
        <h3 ref={doneRef} tabIndex={-1} className={styles.doneTitle}>
          {mistakes === 0
            ? `Все ${MATCH_ROUNDS.length} раундов без единой ошибки — 완벽해요!`
            : "Раунды пройдены"}
        </h3>
        <p className={styles.doneText}>Ошибок за тренировку: {mistakes}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.doneBack} onClick={onBack}>
            Все уровни
          </button>
          <button type="button" className={styles.doneRetry} onClick={restart}>
            Ещё раз
          </button>
          {onNextLevel && (
            <button type="button" className={styles.doneNext} onClick={onNextLevel}>
              Следующий уровень
            </button>
          )}
        </div>
      </div>
    );
  }

  function choose(index: number, side: "left" | "right") {
    if (wrongPair) return;
    const wi = side === "left" ? round.left[index].wi : round.right[index].wi;
    if (matched.includes(wi)) return;

    const nextLeft = side === "left" ? index : selLeft;
    const nextRight = side === "right" ? index : selRight;
    if (nextLeft === null || nextRight === null) {
      if (side === "left") setSelLeft(index);
      else setSelRight(index);
      return;
    }

    const leftWi = round.left[nextLeft].wi;
    const rightWi = round.right[nextRight].wi;
    if (leftWi === rightWi) {
      const newMatched = [...matched, leftWi];
      setMatched(newMatched);
      setSelLeft(null);
      setSelRight(null);
      if (newMatched.length === round.left.length) {
        setTimeout(() => {
          setRoundIdx((r) => r + 1);
          setRound(buildRound(roundIdx + 1 < MATCH_ROUNDS.length ? roundIdx + 1 : 0));
          setMatched([]);
        }, 450);
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongPair([nextLeft, nextRight]);
      setTimeout(() => {
        setWrongPair(null);
        setSelLeft(null);
        setSelRight(null);
      }, 450);
    }
  }

  function cellClass(index: number, side: "left" | "right") {
    const wi = side === "left" ? round.left[index].wi : round.right[index].wi;
    const selected = side === "left" ? selLeft === index : selRight === index;
    const wrong = wrongPair && (side === "left" ? wrongPair[0] === index : wrongPair[1] === index);
    if (matched.includes(wi)) return `${styles.matchItem} ${styles.matchItemMatched}`;
    if (wrong) return `${styles.matchItem} ${styles.matchItemWrong}`;
    if (selected) return `${styles.matchItem} ${styles.matchItemSelected}`;
    return styles.matchItem;
  }

  const totalWords = MATCH_ROUNDS.length * 4;
  const completedWords = roundIdx * 4 + matched.length;

  return (
    <div className={styles.root}>
      <div className={styles.runnerTop}>
        <button type="button" className={styles.runnerBack} onClick={onBack}>
          ← Уровни
        </button>
        <span className={styles.runnerTitle}>{title}</span>
      </div>
      <SessionProgress
        completed={completedWords}
        total={totalWords}
        label={`Раунд ${roundIdx + 1} / ${MATCH_ROUNDS.length} · ошибок: ${mistakes}`}
        showCompleted
      />
      <div className={styles.matchWrap}>
        <div className={styles.matchCol}>
          {round.left.map((slot, i) => (
            <button
              key={i}
              type="button"
              className={`${cellClass(i, "left")} kr`}
              disabled={matched.includes(slot.wi)}
              onClick={() => choose(i, "left")}
            >
              {slot.text}
            </button>
          ))}
        </div>
        <div className={styles.matchCol}>
          {round.right.map((slot, i) => (
            <button
              key={i}
              type="button"
              className={cellClass(i, "right")}
              disabled={matched.includes(slot.wi)}
              onClick={() => choose(i, "right")}
            >
              {slot.text}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.matchStatus}>Найдено пар: {matched.length} / {round.left.length}</p>
    </div>
  );
}
