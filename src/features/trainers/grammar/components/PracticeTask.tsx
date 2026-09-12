"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { checkAnswer } from "../checkAnswer";
import type { Mistake, PracticeTask } from "../types";
import { AnswerReview, Dock, DrillPrompt, KoreanInput } from "./parts";
import styles from "./GrammarTrainer.module.css";

export const TASK_NAMES: Record<PracticeTask["type"], string> = {
  drill: "Преобразование",
  cloze: "Выбор формы",
  reply: "Ответ на реплику",
  match: "Соответствия",
};

type Handlers = {
  onRecord: (ok: boolean, mistake?: Mistake) => void;
  onNext: () => void;
};

export function PracticeTaskCard({ task, ...handlers }: Handlers & { task: PracticeTask }) {
  if (task.type === "drill") return <DrillTask task={task} {...handlers} />;
  if (task.type === "match") return <MatchTask task={task} {...handlers} />;
  return <ChoiceTask task={task} {...handlers} />;
}

function DrillTask({ task, onRecord, onNext }: Handlers & { task: Extract<PracticeTask, { type: "drill" }> }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  function check(event: FormEvent) {
    event.preventDefault();
    if (result !== null) return;
    const ok = checkAnswer(task.item.answers, value);
    onRecord(ok, { pattern: task.pattern, question: task.item.task_ru, answer: task.item.answers[0], yours: value, koreanAnswer: true });
    setResult(ok);
  }

  return (
    <form className={styles.stack} onSubmit={check}>
      <div className={styles.card}>
        <p className={styles.prompt}>Преобразуйте предложение</p>
        <DrillPrompt drill={task.item} />
        <KoreanInput aria-label={task.item.task_ru} value={value} disabled={result !== null} onChange={(event) => setValue(event.target.value)} />
      </div>
      {result !== null && <AnswerReview ok={result} yours={value} answers={task.item.answers} />}
      <Dock>
        {result === null
          ? <button key="check" type="submit" className={styles.primary}>Проверить</button>
          : <button key="next" type="button" className={styles.primary} onClick={onNext}>Далее</button>}
      </Dock>
    </form>
  );
}

function ChoiceTask({ task, onRecord, onNext }: Handlers & { task: Extract<PracticeTask, { type: "cloze" | "reply" }> }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const view = task.type === "cloze"
    ? {
        title: "Выберите подходящую форму",
        sentence: `${task.item.kr_before} _____ ${task.item.kr_after}`.replace(/\s+([.?!,])/g, "$1"),
        translation: task.item.ru,
      }
    : { title: "Выберите верный ответ", sentence: task.item.prompt_kr, translation: task.item.prompt_ru };
  const { options, correct } = task.item;

  function choose(index: number) {
    if (chosen !== null) return;
    setChosen(index);
    onRecord(index === correct, {
      pattern: task.pattern,
      question: view.translation,
      answer: options[correct],
      yours: options[index],
      koreanAnswer: true,
    });
  }

  function optionClass(index: number) {
    if (chosen === null) return styles.option;
    if (index === correct) return styles.optionOk;
    if (index === chosen) return styles.optionBad;
    return styles.option;
  }

  return (
    <>
      <div className={styles.card}>
        <p className={styles.prompt}>{view.title}</p>
        <p className={`${styles.sentence} kr`}>{view.sentence}</p>
        <p className={styles.muted}>{view.translation}</p>
        <div className={styles.options}>
          {options.map((option, i) => (
            <button key={i} type="button" className={`${optionClass(i)} kr`} disabled={chosen !== null} onClick={() => choose(i)}>
              {option}
            </button>
          ))}
        </div>
      </div>
      {chosen !== null && (
        <Dock>
          <button type="button" className={styles.primary} onClick={onNext}>Далее</button>
        </Dock>
      )}
    </>
  );
}

type Side = "kr" | "ru";
const WRONG_FLASH_MS = 550;

function MatchTask({ task, onRecord, onNext }: Handlers & { task: Extract<PracticeTask, { type: "match" }> }) {
  const { pairs, ru } = task;
  const [solved, setSolved] = useState<number[]>([]);
  const [selected, setSelected] = useState<{ side: Side; index: number } | null>(null);
  const [wrong, setWrong] = useState<{ kr: number; ru: number } | null>(null);
  const flash = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(flash.current), []);

  const pairOfRu = (index: number) => pairs.findIndex((pair) => pair.ru === ru[index]);
  const isSolved = (side: Side, index: number) => solved.includes(side === "kr" ? index : pairOfRu(index));

  function choose(side: Side, index: number) {
    if (isSolved(side, index)) return;
    if (!selected || selected.side === side) {
      setSelected(selected?.side === side && selected.index === index ? null : { side, index });
      return;
    }
    const krIndex = side === "kr" ? index : selected.index;
    const ruIndex = side === "ru" ? index : selected.index;
    const target = pairOfRu(ruIndex);
    setSelected(null);
    if (target === krIndex) {
      setSolved((prev) => [...prev, krIndex]);
      onRecord(true);
      return;
    }
    onRecord(false, { pattern: pairs[target].pattern, question: ru[ruIndex], answer: pairs[target].kr, yours: pairs[krIndex].kr, koreanAnswer: true });
    clearTimeout(flash.current);
    setWrong({ kr: krIndex, ru: ruIndex });
    flash.current = setTimeout(() => setWrong(null), WRONG_FLASH_MS);
  }

  function itemClass(side: Side, index: number) {
    if (isSolved(side, index)) return styles.matchOk;
    if (wrong?.[side] === index) return styles.matchBad;
    if (selected?.side === side && selected.index === index) return styles.matchSelected;
    return styles.matchItem;
  }

  return (
    <>
      <div className={styles.card}>
        <p className={styles.prompt}>Соедините форму и перевод</p>
        <div className={styles.match}>
          {pairs.map((pair, row) => (
            <Fragment key={row}>
              <button
                type="button"
                className={`${itemClass("kr", row)} kr`}
                aria-pressed={selected?.side === "kr" && selected.index === row}
                disabled={isSolved("kr", row)}
                onClick={() => choose("kr", row)}
              >
                {pair.kr}
              </button>
              <button
                type="button"
                className={itemClass("ru", row)}
                aria-pressed={selected?.side === "ru" && selected.index === row}
                disabled={isSolved("ru", row)}
                onClick={() => choose("ru", row)}
              >
                {ru[row]}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
      <Dock>
        <button type="button" className={styles.primary} disabled={solved.length < pairs.length} onClick={onNext}>Далее</button>
      </Dock>
    </>
  );
}
