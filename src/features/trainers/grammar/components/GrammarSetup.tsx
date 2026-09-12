"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MultiSelect } from "@/components/ui/Select";
import { plural } from "@/lib/plural";
import { BLITZ_PER_GRAMMAR, BLITZ_SECONDS, countRange, effectiveCount, grammarSearch } from "../areas";
import type { GrammarArea } from "../types";
import { Dock } from "./parts";
import styles from "./GrammarTrainer.module.css";

const grammarsWord = (n: number) => `${n} ${plural(n, ["грамматика", "грамматики", "грамматик"])}`;
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

type Props = {
  areas: GrammarArea[];
  initial: { areas: string[]; count: number; blitz: number };
};

export function GrammarSetup({ areas, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(initial.areas);
  const [count, setCount] = useState(initial.count);
  const [blitz, setBlitz] = useState(initial.blitz);

  const available = areas.reduce((sum, area) => sum + (selected.includes(area.key) ? area.count : 0), 0);
  const { min, max, adjustable } = countRange(available);
  const total = effectiveCount(available, count);
  const questions = total * BLITZ_PER_GRAMMAR;

  function start() {
    const search = grammarSearch({ areas: selected.length === areas.length ? null : selected, count: total, blitz });
    startTransition(() => router.push(`/learning/trainers/grammar/session?${search}`));
  }

  return (
    <div className={styles.session}>
      <section className={styles.setup} aria-label="Настройка сессии">
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.fieldLabel}>Область</span>
            <span className={styles.fieldValue}>{grammarsWord(available)}</span>
          </div>
          <MultiSelect
            values={selected}
            options={areas.map((area) => ({ value: area.key, label: area.label, meta: String(area.count) }))}
            onChange={(values) => setSelected(areas.filter((area) => values.includes(area.key)).map((area) => area.key))}
            placeholder="Выберите области"
            aria-label="Область"
            countForms={["область", "области", "областей"]}
            allLabel="Все области"
            bulkActions
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.fieldLabel}>Грамматик в сессии</span>
            <span className={styles.fieldValue}>{total}</span>
          </div>
          {adjustable ? (
            <div className={styles.range}>
              <small>{min}</small>
              <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={total}
                aria-label="Грамматик в сессии"
                onChange={(event) => setCount(Number(event.target.value))}
              />
              <small>{max}</small>
            </div>
          ) : (
            <p className={styles.fieldNote}>
              {!available
                ? "Выберите хотя бы одну область"
                : available < min
                  ? `В области меньше ${min} — в сессию войдут все`
                  : "В сессию войдут все грамматики области"}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.fieldLabel}>Блиц</span>
            <span className={styles.fieldValue}>
              {total ? `${questions} ${plural(questions, ["вопрос", "вопроса", "вопросов"])} · ${clock(questions * blitz)}` : "—"}
            </span>
          </div>
          <div className={styles.segments} role="group" aria-label="Секунд на вопрос в блице">
            {BLITZ_SECONDS.map((sec) => (
              <button
                key={sec}
                type="button"
                aria-pressed={blitz === sec}
                className={blitz === sec ? styles.segmentActive : styles.segment}
                onClick={() => setBlitz(sec)}
              >
                {sec} с
              </button>
            ))}
          </div>
        </div>
      </section>
      <Dock>
        <button type="button" className={styles.primary} disabled={!total || pending} onClick={start}>
          {pending ? "Собираем сессию…" : total ? `Начать · ${grammarsWord(total)}` : "Выберите область"}
        </button>
      </Dock>
    </div>
  );
}
