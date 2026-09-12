"use client";

import { useState } from "react";
import { SessionProgress } from "@/features/trainers/components/SessionProgress";
import { areaLabel } from "../areas";
import type { GrammarSessionData, Mistake, StageScore } from "../types";
import { BlitzQuestionCard } from "./BlitzQuestion";
import { GrammarResults } from "./GrammarResults";
import { PracticeTaskCard, TASK_NAMES } from "./PracticeTask";
import { StudyStep } from "./StudyStep";
import { scrollToTop } from "./parts";
import styles from "./GrammarTrainer.module.css";

type ScoredStage = "study" | "practice" | "blitz";
type Stage = ScoredStage | "results";

const STAGES: { key: ScoredStage; label: string }[] = [
  { key: "study", label: "Изучение" },
  { key: "practice", label: "Практика" },
  { key: "blitz", label: "Блиц" },
];

const NEXT_LABEL: Record<Stage, string> = {
  study: "Следующая грамматика",
  practice: "К практике",
  blitz: "К блицу",
  results: "К итогам",
};

type Props = {
  session: GrammarSessionData;
  blitzSeconds: number;
  setupHref: string;
};

export function GrammarSession({ session, blitzSeconds, setupHref }: Props) {
  const [stage, setStage] = useState<Stage>("study");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<Record<ScoredStage, StageScore>>({
    study: { correct: 0, total: 0 },
    practice: { correct: 0, total: 0 },
    blitz: { correct: 0, total: 0 },
  });
  const [mistakes, setMistakes] = useState<Mistake[]>([]);

  const lengths: Record<ScoredStage, number> = {
    study: session.study.length,
    practice: session.tasks.length,
    blitz: session.blitz.length,
  };

  function stageAfter(current: ScoredStage): Stage {
    const rest = STAGES.slice(STAGES.findIndex((s) => s.key === current) + 1);
    return rest.find((s) => lengths[s.key] > 0)?.key ?? "results";
  }

  function record(key: ScoredStage) {
    return (ok: boolean, mistake?: Mistake) => {
      setScore((prev) => ({ ...prev, [key]: { correct: prev[key].correct + (ok ? 1 : 0), total: prev[key].total + 1 } }));
      if (!ok && mistake) setMistakes((prev) => [...prev, mistake]);
    };
  }

  function advance(current: ScoredStage) {
    if (step + 1 < lengths[current]) {
      setStep(step + 1);
    } else {
      setStage(stageAfter(current));
      setStep(0);
    }
    scrollToTop();
  }

  const activeIndex = stage === "results" ? STAGES.length : STAGES.findIndex((s) => s.key === stage);
  let progress = null;
  let body;

  if (stage === "study") {
    const item = session.study[step];
    const last = step + 1 === lengths.study;
    progress = <SessionProgress completed={step} total={lengths.study} label={areaLabel(item.category)} />;
    body = (
      <StudyStep
        key={`${step}:${item.id}`}
        item={item}
        nextLabel={last ? NEXT_LABEL[stageAfter("study")] : NEXT_LABEL.study}
        onRecord={record("study")}
        onNext={() => advance("study")}
      />
    );
  } else if (stage === "practice") {
    const task = session.tasks[step];
    progress = <SessionProgress completed={step} total={lengths.practice} label={TASK_NAMES[task.type]} />;
    body = <PracticeTaskCard key={step} task={task} onRecord={record("practice")} onNext={() => advance("practice")} />;
  } else if (stage === "blitz") {
    const question = session.blitz[step];
    progress = <SessionProgress completed={step} total={lengths.blitz} label={question.dir === "kr" ? "Что значит?" : "Как сказать?"} />;
    body = (
      <BlitzQuestionCard
        key={step}
        question={question}
        seconds={blitzSeconds}
        onAnswer={(ok, chosen) => record("blitz")(ok, {
          pattern: question.pattern,
          question: question.prompt,
          answer: question.answer,
          yours: chosen ?? "— не успели —",
          koreanAnswer: question.dir === "ru",
        })}
        onNext={() => advance("blitz")}
      />
    );
  } else {
    body = <GrammarResults score={score} mistakes={mistakes} setupHref={setupHref} />;
  }

  return (
    <div className={styles.session}>
      <div className={styles.head}>
        <ol className={styles.stages} aria-label="Этапы сессии">
          {STAGES.map((s, i) => (
            <li
              key={s.key}
              className={i === activeIndex ? styles.stageActive : i < activeIndex ? styles.stageDone : styles.stage}
              aria-current={i === activeIndex ? "step" : undefined}
            >
              {s.label}
            </li>
          ))}
        </ol>
        {progress}
      </div>
      {body}
    </div>
  );
}
