"use client";

import { useState } from "react";
import {
  REGIONS,
  SONGDO_TRANSPORT,
  placeById,
  regionById,
  type Place,
  type RegionId,
} from "./catalog";
import {
  ACTIONS,
  SCENARIOS,
  VARIANTS,
  activeRun,
  checkCommand,
  checkPlan,
  createRun,
  scenarioById,
  updateRun,
  type MapWorkspace,
  type RouteAction,
  type RouteMode,
} from "./missions";
import { MapCanvas } from "./MapCanvas";
import styles from "./Map.module.css";

export function MapApp({
  workspace,
  onChange,
  onNotes,
  comparison = false,
  regionOverride,
}: {
  workspace: MapWorkspace;
  onChange: (w: MapWorkspace) => void;
  onNotes: () => void;
  comparison?: boolean;
  regionOverride?: RegionId;
}) {
  const [localRegion, setRegion] = useState<RegionId>(
    () => scenarioById(workspace.scenarioId).region,
  );
  const region = regionOverride ?? localRegion;
  const [selected, setSelected] = useState<string>();
  const [action, setAction] = useState<RouteAction>("walk");
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [ru, setRu] = useState(true);
  const [tokens, setTokens] = useState<number[]>([]);
  const [connected, setConnected] = useState(false);
  const mode = workspace.mode;
  const variant = workspace.variant[mode];
  const presentation = VARIANTS[mode][variant];
  const previousRun = activeRun(workspace);
  const run =
    previousRun?.scenarioId === workspace.scenarioId ? previousRun : undefined;
  const scenario = scenarioById(workspace.scenarioId);
  const step = scenario.steps[run?.confirmed ?? 0];
  const current = run?.confirmed
    ? scenario.steps[run.confirmed - 1].to
    : scenario.start;
  const previous =
    run?.confirmed && run.confirmed > 1
      ? scenario.steps[run.confirmed - 2].to
      : scenario.start;
  const currentPoint = placeById(scenario.region, current);
  const previousPoint = placeById(scenario.region, previous);
  const dx = currentPoint.x - previousPoint.x,
    dy = currentPoint.y - previousPoint.y;
  const facing = run?.confirmed
    ? Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "восток"
        : "запад"
      : dy > 0
        ? "юг"
        : "север"
    : scenario.heading.includes("восток")
      ? "восток"
      : scenario.heading.includes("запад")
        ? "запад"
        : "юг";
  const rotation = { восток: -90, запад: 90, север: 180, юг: 0 }[facing];
  const selectedPlace = selected
    ? regionById(region).places.find((p) => p.id === selected)
    : undefined;
  const sameRegion = region === scenario.region;
  const drafted = run?.selected ?? [];
  const route = sameRegion
    ? [
        scenario.start,
        ...(mode === "self"
          ? drafted
          : scenario.steps.slice(0, run?.confirmed ?? 0).map((s) => s.to)),
      ]
    : [];
  const draft = run?.draft ?? "";
  const editDraft = (value: string) => {
    if (run) onChange(updateRun(workspace, { ...run, draft: value }));
  };
  const setMode = (next: RouteMode) => {
    const nextRun = activeRun({ ...workspace, mode: next });
    const scenarioId = nextRun?.scenarioId ?? workspace.scenarioId;
    onChange({
      ...workspace,
      mode: next,
      scenarioId,
      style: VARIANTS[next][workspace.variant[next]].style,
    });
    setRegion(scenarioById(scenarioId).region);
    setSelected(undefined);
    setFeedback(null);
    setTokens([]);
    setConnected(false);
  };
  const start = () => {
    onChange(createRun(workspace));
    setRegion(scenarioById(workspace.scenarioId).region);
    setSelected(undefined);
    setFeedback(null);
    setTokens([]);
  };
  const choosePlace = (p: Place) => {
    setSelected(p.id);
    setFeedback(null);
    if (mode === "self" && run && !run.completed && sameRegion) {
      if (drafted.at(-1) === p.id) return;
      onChange(
        updateRun(workspace, {
          ...run,
          selected:
            variant === 1
              ? [...drafted.slice(0, run.confirmed), p.id]
              : [...drafted, p.id],
          draft: "",
        }),
      );
    }
  };
  const validatePlan = () => {
    if (!run) return;
    if (variant === 1) {
      const point = run.selected.at(-1);
      if (point !== step?.to) {
        setFeedback({
          ok: false,
          message:
            "Этот ориентир не совпадает с текущим указанием. Убери последнюю точку и попробуй ещё.",
        });
        onChange(updateRun(workspace, { ...run, mistakes: run.mistakes + 1 }));
        return;
      }
      const confirmed = run.confirmed + 1;
      onChange(
        updateRun(workspace, {
          ...run,
          confirmed,
          completed: confirmed === scenario.steps.length,
        }),
      );
      setFeedback({
        ok: true,
        message:
          confirmed === scenario.steps.length
            ? "Ты на месте! Маршрут завершён."
            : "Верно. Теперь следующий участок.",
      });
      return;
    }
    const result = checkPlan(run);
    setFeedback(result);
    onChange(updateRun(workspace, result.run));
  };
  const send = () => {
    if (!run || !step) return;
    const phrase =
      variant === 4
        ? draft
        : variant === 3
          ? tokens.map((i) => step.ko.split(" ")[i]).join(" ")
          : undefined;
    const result = checkCommand(step, selected ?? "", action, phrase);
    setFeedback(result);
    if (!result.ok) {
      onChange(updateRun(workspace, { ...run, mistakes: run.mistakes + 1 }));
      return;
    }
    const confirmed = run.confirmed + 1;
    onChange(
      updateRun(workspace, {
        ...run,
        selected: [...run.selected, selected!],
        confirmed,
        commands: [...run.commands, phrase ?? step.ko],
        draft: "",
        completed: confirmed === scenario.steps.length,
      }),
    );
    setSelected(undefined);
    setTokens([]);
  };
  const candidateTokens = step?.ko.split(" ") ?? [];
  return (
    <div className={styles.app} data-layout={presentation.layout}>
      <header className={styles.header}>
        <b>지도 · Карта</b>
        {!comparison && (
          <>
            <select
              aria-label="Тип задания"
              value={mode}
              onChange={(e) => setMode(e.target.value as RouteMode)}
            >
              <option value="self">Мой маршрут</option>
              <option value="guide">Помочь брату 지아</option>
            </select>
            <select
              aria-label="Район карты"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value as RegionId);
                setSelected(undefined);
              }}
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.ru}
                </option>
              ))}
            </select>
            <select
              aria-label="Маршрут задания"
              value={workspace.scenarioId}
              onChange={(e) => {
                onChange({ ...workspace, scenarioId: e.target.value });
                setRegion(scenarioById(e.target.value).region);
                setSelected(undefined);
                setFeedback(null);
              }}
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </>
        )}
        <button type="button" className={styles.notesButton} onClick={onNotes}>
          ▤ Заметки
        </button>
      </header>
      {region === "songdo" && (
        <details className={styles.transportFacts}>
          <summary>Реальный транспорт Сонгдо · проверено 31.10.2026</summary>
          <div>
            {SONGDO_TRANSPORT.map((t) => (
              <article key={t.name}>
                <b>{t.name}</b>
                <p className={styles.korean}>{t.path}</p>
                <p>{t.detail}</p>
                <a href={t.source} target="_blank" rel="noreferrer">
                  Проверить маршрут ↗
                </a>
              </article>
            ))}
          </div>
        </details>
      )}
      <div className={styles.workspace}>
        <div className={styles.mapPanel}>
          <div className={styles.mapHeading}>
            <b>{regionById(region).ko}</b>
            <span>{regionById(region).subtitle}</span>
          </div>
          <MapCanvas
            key={region}
            region={regionById(region)}
            style={workspace.style}
            route={route}
            position={sameRegion ? current : undefined}
            goal={sameRegion ? scenario.goal : undefined}
            selected={selected}
            rotation={rotation}
            onSelect={choosePlace}
          />
          <div
            className={styles.mobilePlaces}
            role="group"
            aria-label="Ориентиры карты"
          >
            {regionById(region).places.map((p) => (
              <button
                type="button"
                key={p.id}
                aria-label={`Выбрать ориентир ${p.ko}`}
                onClick={() => choosePlace(p)}
              >
                {p.ko}
              </button>
            ))}
          </div>
          {selectedPlace && (
            <div className={styles.placeInfo}>
              <b>{selectedPlace.ko}</b>
              <span>{selectedPlace.ru}</span>
              <small>
                {selectedPlace.origin === "real"
                  ? "Реальное место"
                  : selectedPlace.origin === "lesson"
                    ? "Из урока 11"
                    : "Учебная точка"}
              </small>
              {selectedPlace.detail && <p>{selectedPlace.detail}</p>}
              {selectedPlace.source && (
                <a href={selectedPlace.source} target="_blank" rel="noreferrer">
                  Источник ↗
                </a>
              )}
            </div>
          )}
        </div>
        <aside className={styles.missionPanel}>
          <div className={styles.missionTop}>
            <span className={styles.eyebrow}>
              {mode === "self" ? "МОЙ МАРШРУТ" : "지아의 부탁 · ПРОСЬБА 지아"}
            </span>
            <button
              type="button"
              aria-pressed={ru}
              onClick={() => setRu((v) => !v)}
            >
              RU
            </button>
          </div>
          <h3>{scenario.title}</h3>
          {mode === "guide" && (
            <p className={styles.brief}>
              «Я сейчас занята. Помоги моему брату добраться до места,
              пожалуйста».
            </p>
          )}
          <p className={styles.korean}>{scenario.briefKo}</p>
          {ru && <p className={styles.brief}>{scenario.briefRu}</p>}
          {previousRun && previousRun.scenarioId !== workspace.scenarioId && (
            <p className={styles.hint}>
              Выбрано новое задание. Текущий маршрут сохранён в заметках.
            </p>
          )}
          {!run || run.scenarioId !== workspace.scenarioId ? (
            <button type="button" className={styles.primary} onClick={start}>
              Начать задание →
            </button>
          ) : (
            <>
              <div className={styles.progress}>
                <span>
                  {run.completed
                    ? "Завершено"
                    : `${mode === "self" ? "Отмечено" : "Выполнено"}: ${mode === "self" ? drafted.length : run.confirmed} / ${scenario.steps.length}`}
                </span>
                <span>
                  {run.mistakes > 0
                    ? `Попыток с ошибкой: ${run.mistakes}`
                    : "Без ошибок"}
                </span>
                <div>
                  <i
                    style={{
                      width: `${(run.completed ? 1 : run.confirmed / scenario.steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              {run.completed ? (
                <div className={styles.success}>
                  <b>도착했어요! Ты на месте.</b>
                  <p>
                    {mode === "guide"
                      ? "Брат дошёл по твоим указаниям. Все команды сохранены в заметке."
                      : "Ты правильно понял указания и построил путь. Теперь можно объяснить его другому."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode(mode === "self" ? "guide" : "self")}
                  >
                    Сменить роль →
                  </button>
                  <button type="button" onClick={start}>
                    Новая попытка
                  </button>
                </div>
              ) : (
                <>
                  {mode === "self" ? (
                    <div className={styles.instructions}>
                      {(variant === 1
                        ? [scenario.steps[run.confirmed]]
                        : scenario.steps
                      )
                        .filter(Boolean)
                        .map((s, i) => (
                          <div
                            key={s.to}
                            className={
                              presentation.layout === "chat"
                                ? styles.message
                                : styles.instruction
                            }
                          >
                            <span>
                              {String(
                                variant === 1 ? run.confirmed + 1 : i + 1,
                              ).padStart(2, "0")}
                            </span>
                            <div>
                              <p className={styles.korean}>{s.ko}</p>
                              {ru && <p>{s.ru}</p>}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <>
                      {presentation.layout === "call" && (
                        <div className={styles.callCard}>
                          <div>동생</div>
                          <b>
                            {connected
                              ? "● 연결됨 · на связи"
                              : "Входящий от брата 지아"}
                          </b>
                          <button
                            type="button"
                            onClick={() => setConnected((v) => !v)}
                          >
                            {connected
                              ? "Продолжить без окна звонка"
                              : "Ответить"}
                          </button>
                        </div>
                      )}
                      <div className={styles.message}>
                        <b>동생</b>
                        <p className={styles.korean}>
                          {run.confirmed === 0
                            ? "지금 출발하는 곳에 서 있어요. 어떻게 가면 돼요?"
                            : "여기까지 왔어요. 다음에는 어디로 가요?"}
                        </p>
                        <p>
                          {ru
                            ? `Я у ${placeById(scenario.region, current).ko}. Куда дальше?`
                            : scenario.heading}
                        </p>
                      </div>
                      <p className={styles.hint}>
                        Отметь следующую точку и выбери действие. Ориентация:{" "}
                        {`смотри на ${facing}`}.
                      </p>
                      <label className={styles.field}>
                        Действие
                        <select
                          aria-label="Глагол для маршрута"
                          value={action}
                          onChange={(e) =>
                            setAction(e.target.value as RouteAction)
                          }
                        >
                          {ACTIONS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.ko} · {a.ru}
                            </option>
                          ))}
                        </select>
                      </label>
                      {variant === 4 ? (
                        <label className={styles.field}>
                          Твоё указание
                          <textarea
                            aria-label="Указание по-корейски"
                            value={draft}
                            onChange={(e) => editDraft(e.target.value)}
                            placeholder="Ориентир + направление + действие + -세요"
                            rows={3}
                          />
                        </label>
                      ) : variant === 3 ? (
                        <div className={styles.builder}>
                          <p>Собери фразу</p>
                          <div>
                            {candidateTokens
                              .map((token, i) => ({ token, i }))
                              .sort((a, b) => b.i - a.i)
                              .map(({ token, i }) => (
                                <button
                                  type="button"
                                  key={i}
                                  disabled={tokens.includes(i)}
                                  onClick={() => setTokens((t) => [...t, i])}
                                >
                                  {token}
                                </button>
                              ))}
                          </div>
                          <output>
                            {tokens.map((i) => candidateTokens[i]).join(" ") ||
                              "…"}
                          </output>
                          <button type="button" onClick={() => setTokens([])}>
                            Собрать заново
                          </button>
                        </div>
                      ) : (
                        <div className={styles.formula}>
                          <small>Конструкция участка</small>
                          <p>{step.grammar}</p>
                        </div>
                      )}
                      <details className={styles.hint}>
                        <summary>Подсказка к фразе</summary>
                        <p className={styles.korean}>{step.ko}</p>
                        {ru && <p>{step.ru}</p>}
                      </details>
                    </>
                  )}
                  {selectedPlace && (
                    <div className={styles.selected}>
                      Следующая точка: <b>{selectedPlace.ko}</b>
                    </div>
                  )}
                  {feedback && (
                    <p
                      className={
                        feedback.ok ? styles.feedbackOk : styles.feedbackError
                      }
                      role="status"
                    >
                      {feedback.message}
                    </p>
                  )}
                  <div className={styles.actions}>
                    {mode === "self" ? (
                      <>
                        <button
                          type="button"
                          disabled={
                            !drafted.length ||
                            (variant === 1 && drafted.length <= run.confirmed)
                          }
                          onClick={() =>
                            onChange(
                              updateRun(workspace, {
                                ...run,
                                selected: drafted.slice(0, -1),
                              }),
                            )
                          }
                        >
                          ← Убрать точку
                        </button>
                        <button
                          type="button"
                          className={styles.primary}
                          disabled={
                            !drafted.length ||
                            (variant === 1 && drafted.length <= run.confirmed)
                          }
                          onClick={validatePlan}
                        >
                          {variant === 1
                            ? "Проверить шаг"
                            : "Проверить маршрут"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={
                          !selected ||
                          !sameRegion ||
                          (presentation.layout === "call" && !connected)
                        }
                        onClick={send}
                      >
                        Отправить указание →
                      </button>
                    )}
                  </div>
                  {mode === "self" && drafted.length > 0 && (
                    <ol className={styles.routeList}>
                      {drafted.map((id, i) => (
                        <li key={`${id}-${i}`}>
                          {placeById(scenario.region, id)?.ko ?? id}
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )}
            </>
          )}
          {run?.commands.length ? (
            <div className={styles.history}>
              <b>Отправленные указания</b>
              {run.commands.map((command, i) => (
                <p className={styles.korean} key={i}>
                  {command}
                </p>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
