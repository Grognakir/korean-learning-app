"use client";

import { useState } from "react";
import { LEVELS } from "./levels";
import { MatchRunner } from "./MatchRunner";
import { McqRunner } from "./McqRunner";
import { TypeRunner } from "./TypeRunner";
import { buildPhraseMcqSession, buildWordMcqSession } from "./data";
import styles from "./Trainer.module.css";

export function QuestionsTrainer() {
  const [activeId, setActiveId] = useState<number | null>(null);

  if (activeId === null) {
    return (
      <div className={styles.levelGrid}>
        {LEVELS.map((level) => (
          <div key={level.id} className={styles.levelCard}>
            <div className={styles.lvNum}>{level.id}</div>
            <div className={styles.lvBody}>
              <h4>{level.title}</h4>
              <p>{level.description}</p>
            </div>
            <button type="button" className={styles.lvGo} onClick={() => setActiveId(level.id)}>
              Начать
            </button>
          </div>
        ))}
      </div>
    );
  }

  const level = LEVELS.find((l) => l.id === activeId)!;
  const nextLevel = LEVELS.find((l) => l.id === activeId + 1);
  const onBack = () => setActiveId(null);
  const onNextLevel = nextLevel ? () => setActiveId(nextLevel.id) : undefined;

  if (level.kind === "match") {
    return <MatchRunner title={level.title} onBack={onBack} onNextLevel={onNextLevel} />;
  }
  if (level.kind === "type") {
    return <TypeRunner title={level.title} onBack={onBack} onNextLevel={onNextLevel} />;
  }
  if (level.kind === "mcq-word") {
    const direction = level.direction!;
    return (
      <McqRunner
        title={level.title}
        buildSession={() => buildWordMcqSession(direction)}
        onBack={onBack}
        onNextLevel={onNextLevel}
      />
    );
  }
  return (
    <McqRunner
      title={level.title}
      buildSession={buildPhraseMcqSession}
      onBack={onBack}
      onNextLevel={onNextLevel}
    />
  );
}
